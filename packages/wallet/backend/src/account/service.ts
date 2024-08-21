import { Account } from './model'
import { User } from '@/user/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'
import { Transaction } from '@/transaction/model'
import { Amount } from '@/rafiki/service'
import { Conflict, NotFound } from '@shared/backend'
import { Env } from '@/config/env'

type CreateAccountArgs = {
  userId: string
  name: string
  assetId: string
}

type FundAccountArgs = {
  userId: string
  amount: number
  accountId: string
}

type WithdrawFundsArgs = FundAccountArgs

interface IAccountService {
  createDefaultAccount: (userId: string) => Promise<Account | undefined>
  createAccount: (args: CreateAccountArgs) => Promise<Account>
  getAccounts: (
    userId: string,
    includeWalletAddress?: boolean,
    includeWalletKeys?: boolean
  ) => Promise<Account[]>
  getAccountById: (userId: string, accountId: string) => Promise<Account>
  getAccountBalance: (userId: string, assetCode: string) => Promise<number>
  fundAccount: (args: FundAccountArgs) => Promise<void>
  withdrawFunds: (args: WithdrawFundsArgs) => Promise<void>
}

export class AccountService implements IAccountService {
  constructor(
    private rapydClient: RapydClient,
    private rafikiClient: RafikiClient,
    private env: Env
  ) {}

  public async createAccount(args: CreateAccountArgs): Promise<Account> {
    const existingAccount = await Account.query()
      .where('userId', args.userId)
      .where('name', args.name)
      .first()
    if (existingAccount) {
      throw new Conflict(
        `An account with the name '${args.name}' already exists`
      )
    }
    const asset = await this.rafikiClient.getAssetById(args.assetId)

    if (!asset) {
      throw new NotFound()
    }

    const existingAssetAccount = await Account.query()
      .where('assetCode', asset.code)
      .where('userId', args.userId)
      .first()
    if (existingAssetAccount) {
      throw new Conflict(
        `You can only have one account per asset. ${asset.code} account already exists`
      )
    }

    // issue virtual account to wallet
    const user = await User.query().findById(args.userId)
    if (!user) {
      throw new NotFound()
    }

    const result = await this.rapydClient.issueVirtualAccount({
      country: user.country ?? '',
      currency: asset.code,
      ewallet: user.rapydWalletId ?? ''
    })

    if (result.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to issue virtal account to ewallet: ${result.status?.message}`
      )
    }
    // save virtual bank account number to database
    const virtualAccount = result.data

    const account = await Account.query().insert({
      name: args.name,
      userId: args.userId,
      assetCode: asset.code,
      assetId: args.assetId,
      assetScale: asset.scale,
      virtualAccountId: virtualAccount.id
    })
    await this.rapydClient.simulateBankTransferToWallet({
      amount: 0,
      currency: account.assetCode,
      issued_bank_account: account.virtualAccountId
    })

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    const accountsBalance = await this.rapydClient.getAccountsBalance(
      user.rapydWalletId
    )

    account.balance = transformBalance(
      accountsBalance.data?.find((acc) => acc.currency === account.assetCode)
        ?.balance ?? 0,
      asset.scale
    )

    return account
  }

  public async getAccounts(
    userId: string,
    includeWalletAddress?: boolean,
    includeWalletKeys?: boolean
  ): Promise<Account[]> {
    const user = await User.query().findById(userId)

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    let query = Account.query().where('userId', userId)
    if (includeWalletAddress) {
      const includeModels = includeWalletKeys
        ? 'walletAddresses.[keys]'
        : 'walletAddresses'
      query = query
        .withGraphFetched(includeModels)
        .modifyGraph('walletAddresses', (builder) => {
          builder.where({ active: true }).orderBy('createdAt', 'ASC')
        })
    }

    const accounts = await query

    if (!includeWalletAddress) {
      const accountsBalance = await this.rapydClient.getAccountsBalance(
        user.rapydWalletId
      )

      accounts.forEach((acc) => {
        acc.balance = transformBalance(
          accountsBalance.data?.find(
            (rapydAccount) => rapydAccount.currency === acc.assetCode
          )?.balance ?? 0,
          acc.assetScale
        )
      })
    }

    return accounts
  }

  public async getAccountByAssetCode(
    userId: string,
    amount: Amount
  ): Promise<Account> {
    const account = await Account.query()
      .where('userId', userId)
      .where('assetCode', amount.assetCode)
      .first()

    if (!account) {
      throw new NotFound()
    }

    account.balance = transformBalance(
      await this.getAccountBalance(userId, account.assetCode),
      account.assetScale
    )

    return account
  }

  public async getAccountById(
    userId: string,
    accountId: string
  ): Promise<Account> {
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)

    if (!account) {
      throw new NotFound()
    }

    account.balance = transformBalance(
      await this.getAccountBalance(userId, account.assetCode),
      account.assetScale
    )

    return account
  }

  async getAccountBalance(userId: string, assetCode: string): Promise<number> {
    const user = await User.query().findById(userId)

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    const accountsBalance = await this.rapydClient.getAccountsBalance(
      user.rapydWalletId
    )
    return (
      accountsBalance.data?.find((acc) => acc.currency === assetCode)
        ?.balance ?? 0
    )
  }

  public async fundAccount(args: FundAccountArgs): Promise<void> {
    const existingAccount = await Account.query()
      .where('userId', args.userId)
      .where('id', args.accountId)
      .first()
    if (!existingAccount) {
      throw new NotFound()
    }

    // fund amount to wallet account
    const result = await this.rapydClient.simulateBankTransferToWallet({
      amount: args.amount,
      currency: existingAccount.assetCode,
      issued_bank_account: existingAccount.virtualAccountId
    })

    if (result.status?.status !== 'SUCCESS') {
      throw new Error(`Unable to fund your account: ${result.status?.message}`)
    }

    const asset = await this.rafikiClient.getAssetById(existingAccount.assetId)
    const transactions = result.data.transactions
    await Transaction.query().insert({
      accountId: existingAccount.id,
      paymentId: transactions[transactions.length - 1].id,
      assetCode: existingAccount.assetCode,
      value: transformBalance(
        args.amount,
        this.env.MAX_ASSET_SCALE || asset.scale
      ),
      type: 'INCOMING',
      status: 'COMPLETED',
      description: 'Fund account'
    })
  }

  public async withdrawFunds(args: WithdrawFundsArgs): Promise<void> {
    const account = await this.findAccountById(args.accountId, args.userId)

    const user = await User.query().findById(args.userId)
    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    // simulate withdraw funds to a bank account
    const withdrawFunds = await this.rapydClient.withdrawFundsFromAccount({
      assetCode: account.assetCode,
      amount: args.amount,
      user: user
    })

    if (withdrawFunds.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${withdrawFunds.status.message}`
      )
    }

    const asset = await this.rafikiClient.getAssetById(account.assetId)
    await Transaction.query().insert({
      accountId: account.id,
      paymentId: withdrawFunds.data.id,
      assetCode: account.assetCode,
      value: transformBalance(args.amount, asset.scale),
      type: 'OUTGOING',
      status: 'COMPLETED',
      description: 'Withdraw funds'
    })
  }

  public findAccountById = async (
    accountId: string,
    userId: string
  ): Promise<Account> => {
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)

    if (!account) {
      throw new NotFound()
    }

    return account
  }

  public async createDefaultAccount(
    userId: string,
    name = 'USD Account'
  ): Promise<Account | undefined> {
    const asset = (await this.rafikiClient.listAssets({ first: 100 })).find(
      (asset) =>
        asset.code === 'USD' && asset.scale === this.env.MAX_ASSET_SCALE
    )
    if (!asset) {
      return
    }
    const account = await this.createAccount({
      name,
      userId,
      assetId: asset.id
    })

    await this.fundAccount({
      userId,
      amount: 100,
      accountId: account.id
    })

    return account
  }
}
