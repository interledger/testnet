import { Conflict, NotFound } from '@/errors'
import { Account } from './model'
import { User } from '../user/model'
import { RapydClient } from '../rapyd/rapyd-client'
import { Logger } from 'winston'
import { formatBalance } from '../utils/helpers'

interface IAccountService {
  createAccount: (userId: string, name: string, assetId: string) => Promise<any>
}

interface CountriesServiceDependencies {
  rapyd: RapydClient
  logger: Logger
}

export class AccountService implements IAccountService {
  constructor(private deps: CountriesServiceDependencies) {}

  public async createAccount(
    userId: string,
    name: string,
    assetId: string
  ): Promise<any> {
    const existingAccount = await Account.query()
      .where('userId', userId)
      .where('name', name)
      .first()
    if (existingAccount) {
      throw new Conflict(`An account with the name '${name}' already exists`)
    }

    // const asset = await getAsset(assetRafikiId)
    const asset: any = {}

    if (!asset) {
      throw new NotFound()
    }
    const existingAsset = await Account.query()
      .where('assetCode', asset.code)
      .where('userId', userId)
      .first()
    if (existingAsset) {
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

    if (result.status.status !== 'SUCCESS') {
      //! Throw
      throw new Error()
      //   return res.status(500).json({
      //     message: `Unable to issue virtal account to ewallet: ${result.status.message}`,
      //     success: false
      //   })
    }

    // save virtual bank account number to database
    const virtualAccount = result.data

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

  public async getAccounts(userId: string): Promise<any> {
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

  public async getAccountById(userId: string, accountId: string): Promise<any> {
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)

    if (!account) {
      throw new NotFound()
    }

    account.balance = await this.getAccountBalance(userId, account.assetCode)

    return account
  }

  private async getAccountBalance(
    userId: string,
    assetCode: string
  ): Promise<bigint> {
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

    if (result.status.status !== 'SUCCESS') {
      //! Throw error
      throw new Error()
      // return res.status(500).json({
      //   message: `Unable to fund your account: ${result.status.message}`,
      //   success: false
      // })
    }

    return result
  }
}

/*

try {
   

*/
