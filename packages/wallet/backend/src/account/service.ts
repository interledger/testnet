import { Conflict, NotFound } from '@/errors'
import { Account } from './model'
import { User } from '@/user/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { Logger } from 'winston'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'
import { Transaction } from '@/transaction/model'
import { QuoteWithFees } from '@/quote/controller'
import { QuoteService } from '@/quote/service'
import { PaymentPointerService } from '@/paymentPointer/service'
import { getRandomValues } from 'crypto'

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
  createExchangeQuote: (args: CreateExchangeQuote) => Promise<QuoteWithFees>
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
  quoteService: () => QuoteService
  paymentPointerService: () => PaymentPointerService
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

  public async createExchangeQuote({
    userId,
    accountId,
    assetCode,
    amount
  }: CreateExchangeQuote): Promise<QuoteWithFees> {
    const accountFrom = await Account.query()
      .findById(accountId)
      .where('userId', userId)
      .withGraphFetched({ paymentPointers: true })
      .modifyGraph('paymentPointers', (builder) => {
        builder.where({ active: true }).orderBy('createdAt', 'ASC').limit(1)
      })

    if (!accountFrom) {
      throw new NotFound(`The source account does not exist for this user.`)
    }

    const assetInRafiki = (
      await this.deps.rafiki.listAssets({ first: 100 })
    ).find((asset) => asset.code === assetCode)
    if (!assetInRafiki) {
      throw new NotFound(
        `Asset Code "${assetCode}" does not exist in Rafiki; Payment Pointer could not be automatically created.`
      )
    }

    let senderPpId = accountFrom.paymentPointers?.[0]?.id
    if (!senderPpId) {
      const paymentPointer = await this.deps
        .paymentPointerService()
        .create(
          userId,
          accountFrom.id,
          getRandomValues(new Uint32Array(1))[0].toString(16),
          `Exchange Payment Pointer`
        )
      senderPpId = paymentPointer.id
    }

    let accountTo = await Account.query()
      .where({ userId, assetCode })
      .withGraphFetched({ paymentPointers: true })
      .modifyGraph('paymentPointers', (builder) => {
        builder.where({ active: true }).orderBy('createdAt', 'ASC').limit(1)
      })
      .limit(1)
      .first()

    if (!accountTo) {
      accountTo = await this.createAccount({
        name: `${assetCode} account`,
        userId,
        assetId: assetInRafiki.id
      })
    }
    let receiverPp = accountTo.paymentPointers?.[0]?.url
    if (!receiverPp) {
      const paymentPointer = await this.deps
        .paymentPointerService()
        .create(
          userId,
          accountTo.id,
          getRandomValues(new Uint32Array(1))[0].toString(16),
          `${assetCode} Payment Pointer`
        )
      receiverPp = paymentPointer.url
    }

    const quote = await this.deps.quoteService().create({
      userId,
      paymentPointerId: senderPpId,
      amount,
      description: 'Currency exchange.',
      isReceive: false,
      receiver: receiverPp
    })

    return quote
  }
}
