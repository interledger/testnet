import { Conflict, NotFound } from '@/errors'
import { Account } from './model'
import { User } from '@/user/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { Logger } from 'winston'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'

type CreateAccountArgs = {
  userId: string
  name: string
  assetId: string
}

type FundsArgs = {
  userId: string
  amount: number
  assetCode: string
}

type FundAccountArgs = FundsArgs
type WithdrawFundsArgs = FundsArgs

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

    accounts.forEach((acc) => {
      acc.balance = transformBalance(
        accountsBalance.data?.find(
          (rapydAccount) => rapydAccount.currency === acc.assetCode
        )?.balance ?? 0,
        acc.assetScale
      )
    })

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
      .where('assetCode', args.assetCode)
      .first()
    if (!existingAccount) {
      throw new NotFound()
    }

    // fund amount to wallet account
    const result = await this.deps.rapyd.simulateBankTransferToWallet({
      amount: args.amount,
      currency: args.assetCode,
      issued_bank_account: existingAccount.virtualAccountId
    })

    if (result.status?.status !== 'SUCCESS') {
      throw new Error(`Unable to fund your account: ${result.status?.message}`)
    }
  }

  public async withdrawFunds(args: FundAccountArgs): Promise<void> {
    const existingAccount = await Account.query()
      .where('userId', args.userId)
      .where('assetCode', args.assetCode)
      .first()
    if (!existingAccount) {
      throw new NotFound()
    }

    // get list of payout method types for currency, if we get to production: get payout type required fields will be needed
    const payoutType = await this.deps.rapyd.getPayoutMethodTypes(
      args.assetCode
    )

    if (payoutType.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${payoutType.status.message}`
      )
    }

    const user = await User.query().findById(args.userId)
    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    // withdraw funds/create payout from wallet account into bank account
    const userDetails = {
      name: `${user.firstName} ${user.lastName}`,
      address: user.address ?? ''
    }
    const payout = await this.deps.rapyd.withdrawFundsFromAccount({
      beneficiary: userDetails,
      payout_amount: args.amount,
      payout_currency: args.assetCode,
      ewallet: user.rapydWalletId ?? '',
      sender: userDetails,
      sender_country: user.country ?? '',
      sender_currency: args.assetCode,
      beneficiary_entity_type: 'individual',
      sender_entity_type: 'individual',
      payout_method_type: payoutType.data[0].payout_method_type
    })

    if (payout.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${payout.status.message}`
      )
    }

    // complete third party/bank payout
    const completePayoutResponse = await this.deps.rapyd.completePayout({
      payout: payout.data.id,
      amount: args.amount
    })

    if (completePayoutResponse.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${completePayoutResponse.status.message}`
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
