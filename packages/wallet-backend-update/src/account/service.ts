import { Conflict, NotFound } from '@/errors'
import { Account } from './model'
import { User } from '@/user/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { Logger } from 'winston'
import { formatBalance } from '@/utils/helpers'
import { RafikiClient } from '@/rafiki/rafiki-client'

interface IAccountService {
  createAccount: (
    userId: string,
    name: string,
    assetId: string
  ) => Promise<Account>
  getAccounts: (userId: string) => Promise<Account[]>
  getAccountById: (userId: string, accountId: string) => Promise<Account>
  getAccountBalance: (userId: string, assetCode: string) => Promise<bigint>
  fundAccount: (
    userId: string,
    amount: number,
    assetCode: string
  ) => Promise<any>
}

interface CountriesServiceDependencies {
  rapyd: RapydClient
  rafiki: RafikiClient
  logger: Logger
}

export class AccountService implements IAccountService {
  constructor(private deps: CountriesServiceDependencies) {}

  public async createAccount(
    userId: string,
    name: string,
    assetId: string
  ): Promise<Account> {
    const existingAccount = await Account.query()
      .where('userId', userId)
      .where('name', name)
      .first()
    if (existingAccount) {
      throw new Conflict(`An account with the name '${name}' already exists`)
    }

    const asset = await this.deps.rafiki.getAssetById(assetId)

    if (!asset) {
      throw new NotFound()
    }

    const existingAssetAccount = await Account.query()
      .where('assetCode', asset.code)
      .where('userId', userId)
      .first()

    if (existingAssetAccount) {
      throw new Conflict(
        `An account with the same asset ${asset.code} already exists`
      )
    }

    // issue virtual account to wallet
    const user = await User.query().findById(userId)
    if (!user) {
      throw new NotFound()
    }

    const result = await this.deps.rapyd.issueVirtualAccount({
      country: user.country ?? '',
      currency: asset.code,
      ewallet: user.rapydWalletId ?? ''
    })

    if (result.data.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to issue virtal account to ewallet: ${result.data.status.message}`
      )
    }

    // save virtual bank account number to database
    const virtualAccount = result.data.data

    const account = await Account.query().insert({
      name,
      userId,
      assetCode: asset.code,
      assetId,
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
    account.balance = formatBalance(
      accountsBalance.data.find((acc) => acc.currency === account.assetCode)
        ?.balance ?? 0
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
      acc.balance = formatBalance(
        accountsBalance.data.find(
          (rapydAccount) => rapydAccount.currency === acc.assetCode
        )?.balance ?? 0
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

    account.balance = await this.getAccountBalance(userId, account.assetCode)

    return account
  }

  async getAccountBalance(userId: string, assetCode: string): Promise<bigint> {
    const user = await User.query().findById(userId)

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    const accountsBalance = await this.deps.rapyd.getAccountsBalance(
      user.rapydWalletId
    )
    return formatBalance(
      accountsBalance.data.find((acc) => acc.currency === assetCode)?.balance ??
        0
    )
  }

  public async fundAccount(userId: string, amount: number, assetCode: string) {
    const existingAccount = await Account.query()
      .where('userId', userId)
      .where('assetCode', assetCode)
      .first()
    if (!existingAccount) {
      throw new NotFound()
    }

    // fund amount to wallet account
    const result = await this.deps.rapyd.simulateBankTransferToWallet({
      amount: amount,
      currency: assetCode,
      issued_bank_account: existingAccount.virtualAccountId
    })

    if (result.data.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to fund your account: ${result.data.status.message}`
      )
    }

    return result
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
