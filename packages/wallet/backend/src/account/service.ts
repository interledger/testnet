import { Conflict, NotFound } from '@/errors'
import { Account } from './model'
import { User } from '@/user/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { Logger } from 'winston'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'
import { PaymentPointer } from '@/paymentPointer/model'

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
  createAccount: (args: CreateAccountArgs) => Promise<Account>
  getAccounts: (userId: string) => Promise<Account[]>
  getAccountById: (userId: string, accountId: string) => Promise<Account>
  getAccountBalance: (userId: string, assetCode: string) => Promise<number>
  fundAccount: (args: FundAccountArgs) => Promise<void>
  withdrawFunds: (args: WithdrawFundsArgs) => Promise<void>
}

interface CountriesServiceDependencies {
  rapyd: RapydClient
  rafiki: RafikiClient
  logger: Logger
}

export class AccountService implements IAccountService {
  constructor(private deps: CountriesServiceDependencies) {}

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
    const asset = await this.deps.rafiki.getAssetById(args.assetId)

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

    const result = await this.deps.rapyd.issueVirtualAccount({
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
    await this.deps.rapyd.simulateBankTransferToWallet({
      amount: 0,
      currency: account.assetCode,
      issued_bank_account: account.virtualAccountId
    })

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    const accountsBalance = await this.deps.rapyd.getAccountsBalance(
      user.rapydWalletId
    )

    account.balance = transformBalance(
      accountsBalance.data?.find((acc) => acc.currency === account.assetCode)
        ?.balance ?? 0,
      asset.scale
    )

    return account
  }

  public async getAccounts(userId: string): Promise<Account[]> {
    const accounts = await Account.query().where('userId', userId)

    const user = await User.query().findById(userId)

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    const accountsBalance = await this.deps.rapyd.getAccountsBalance(
      user.rapydWalletId
    )

    for (let i = 0; i < accounts.length; i++) {
      accounts[i].balance = transformBalance(
        accountsBalance.data?.find(
          (rapydAccount) => rapydAccount.currency === accounts[i].assetCode
        )?.balance ?? 0,
        accounts[i].assetScale
      )
      accounts[i].paymentPointers = await PaymentPointer.query().where(
        'accountId',
        accounts[i].id
      )
    }

    return accounts
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

    const accountsBalance = await this.deps.rapyd.getAccountsBalance(
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
    const result = await this.deps.rapyd.simulateBankTransferToWallet({
      amount: args.amount,
      currency: existingAccount.assetCode,
      issued_bank_account: existingAccount.virtualAccountId
    })

    if (result.status?.status !== 'SUCCESS') {
      throw new Error(`Unable to fund your account: ${result.status?.message}`)
    }
  }

  public async withdrawFunds(args: WithdrawFundsArgs): Promise<void> {
    const account = await this.findAccountById(args.accountId, args.userId)

    const user = await User.query().findById(args.userId)
    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    // simulate withdraw funds to a bank account
    const withdrawFunds = await this.deps.rapyd.withdrawFundsFromAccount({
      assetCode: account.assetCode,
      amount: args.amount,
      user: user
    })

    if (withdrawFunds.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${withdrawFunds.status.message}`
      )
    }
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
}
