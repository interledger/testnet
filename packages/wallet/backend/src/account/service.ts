import { Conflict, NotFound } from '@/errors'
import { Account } from './model'
import { User } from '@/user/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { Logger } from 'winston'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'
import { Transaction } from '@/transaction/model'
import { RatesResponse } from '@/rafiki/service'
import { QuoteWithFees } from '@/quote/controller'
import { QuoteService } from '@/quote/service'

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
  getAccounts: (userId: string) => Promise<Account[]>
  getAccountById: (userId: string, accountId: string) => Promise<Account>
  getAccountBalance: (userId: string, assetCode: string) => Promise<number>
  fundAccount: (args: FundAccountArgs) => Promise<void>
  withdrawFunds: (args: WithdrawFundsArgs) => Promise<void>
}

type CreateExchangeQuote = {
  userId: string
  accountId: string
  assetCode: string
  amount: number
}

interface CountriesServiceDependencies {
  rapyd: RapydClient
  rafiki: RafikiClient
  logger: Logger
  quoteServiceGetter: () => QuoteService
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

  public async getAccounts(
    userId: string,
    hasPaymentPointer?: boolean
  ): Promise<Account[]> {
    const user = await User.query().findById(userId)

    if (!user || !user.rapydWalletId) {
      throw new NotFound()
    }

    let query = Account.query().where('userId', userId)
    if (hasPaymentPointer)
      query = query
        .withGraphFetched({ paymentPointers: true })
        .modifyGraph('paymentPointers', (builder) => {
          builder.where({ active: true }).orderBy('createdAt', 'ASC')
        })

    const accounts = await query

    if (!hasPaymentPointer) {
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

    const asset = await this.deps.rafiki.getAssetById(existingAccount.assetId)
    const transactions = result.data.transactions
    await Transaction.query().insert({
      accountId: existingAccount.id,
      paymentId: transactions[transactions.length - 1].id,
      assetCode: existingAccount.assetCode,
      value: transformBalance(args.amount, asset.scale),
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

    const asset = await this.deps.rafiki.getAssetById(account.assetId)
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
    userId: string
  ): Promise<Account | undefined> {
    const asset = (await this.deps.rafiki.listAssets({ first: 100 })).find(
      (asset) => asset.code === 'EUR' && asset.scale === 2
    )
    if (!asset) {
      return
    }
    const account = await this.createAccount({
      name: 'EUR Account',
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

  public async getExchangeRates(
    userId: string,
    accountId: string
  ): Promise<RatesResponse> {
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)

    if (!account) {
      throw new NotFound()
    }

    const assetCode = account.assetCode
    // const rates = await this.deps.rapydService.getRates(assetCode)

    // ### --------------------------- <DELETE ME> --------------------------- ###
    // we will use deps.rapydService.getRates() instead of this mock
    interface Rates {
      [currency: string]: { [currency: string]: number }
    }
    const getRates = (base: string): RatesResponse => {
      const exchangeRates: Rates = {
        USD: {
          EUR: 1.10019
        },
        EUR: {
          USD: 0.908936
        }
      }
      return {
        base,
        rates: exchangeRates[base] ?? {}
      }
    }
    // ### --------------------------- </DELETE ME> --------------------------- ###

    const rates = getRates(assetCode)

    if (!rates) {
      throw new NotFound(
        `Exchange Rates were not found for this assetCode ${assetCode}`
      )
    }

    return rates
  }

  public async createExchangeQuote({
    userId,
    accountId,
    assetCode,
    amount
  }: CreateExchangeQuote): Promise<QuoteWithFees> {
    const accountFrom = await Account.query()
      .findById(accountId)
      .withGraphFetched({ paymentPointers: true })
      .modifyGraph('paymentPointers', (builder) => {
        builder.where({ active: true }).orderBy('createdAt', 'ASC').limit(1)
      })

    const accountPpId = accountFrom?.paymentPointers?.[0]?.id

    if (!accountPpId) {
      throw new NotFound(
        'You do not have a PaymentPointer for this Account. Please create at least 1 PP in order to Exchange.'
      )
    }

    const accountTo = await Account.query()
      .where({ userId, assetCode })
      .withGraphFetched({ paymentPointers: true })
      .modifyGraph('paymentPointers', (builder) => {
        builder.where({ active: true }).orderBy('createdAt', 'ASC').limit(1)
      })
      .limit(1)
      .first()
    const receiverPp = accountTo?.paymentPointers?.[0]?.url

    if (!receiverPp) {
      throw 1234
      // TODO - create Account and PP
    }

    const quote = await this.deps.quoteServiceGetter().create({
      userId,
      paymentPointerId: accountPpId,
      amount,
      isReceive: false,
      receiver: receiverPp
    })

    return quote
  }
}
