import { Transaction, TransactionSource } from './model'
import { OrderByDirection, Page, PartialModelObject } from 'objection'
import { AccountService } from '@/account/service'
import { Logger } from 'winston'
import { PaginationQueryParams } from '@/shared/types'
import { prefixSomeObjectKeys, transformBalance } from '@/utils/helpers'
import { Knex } from 'knex'
import {
  IncomingPayment,
  OutgoingPayment
} from '@/rafiki/backend/generated/graphql'
import { WalletAddress } from '@/walletAddress/model'
import { Account } from '@/account/model'
import { CardService } from '@/card/service'
import NodeCache from 'node-cache'
import { GateHubClient } from '@/gatehub/client'

const FETCHING_TRANSACTIONS_KEY = 'FETCHING_TRANSACTIONS'
type ListAllTransactionsInput = {
  userId: string
  paginationParams: PaginationQueryParams
  filterParams: Partial<Transaction>
  orderByDate: OrderByDirection
}

type SEPATransactionInput = {
  receiver: string
  legalName: string
}

type SEPADetails = {
  vop: {
    description: string
    nonce: string
    match: string
  }
}
export interface ISecondParty {
  names?: string
  walletAddresses?: string
}
export interface ITransactionService {
  list: (
    userId: string,
    accountId: string,
    walletAddressId: string,
    orderByDate: OrderByDirection
  ) => Promise<Transaction[]>
  updateTransaction: (
    where: PartialModelObject<Transaction>,
    update: PartialModelObject<Transaction>
  ) => Promise<void>
  listAll: (input: ListAllTransactionsInput) => Promise<Page<Transaction>>
  processPendingIncomingPayments: () => Promise<string | undefined>
  getSepaDetails: (input: SEPATransactionInput) => Promise<SEPADetails>
}

export class TransactionService implements ITransactionService {
  cache: NodeCache = new NodeCache({ stdTTL: 30 })
  constructor(
    private accountService: AccountService,
    private logger: Logger,
    private knex: Knex,
    private cardService: CardService,
    private gateHubClient: GateHubClient
  ) {}

  async list(
    userId: string,
    accountId: string,
    walletAddressId: string,
    orderByDate: OrderByDirection
  ): Promise<Transaction[]> {
    await this.accountService.findAccountById(accountId, userId)

    return Transaction.query()
      .where('walletAddressId', walletAddressId)
      .orderBy('createdAt', orderByDate)
  }

  async updateTransaction(
    where: PartialModelObject<Transaction>,
    update: PartialModelObject<Transaction>
  ): Promise<void> {
    try {
      this.logger.info(`Updating transaction with: ${JSON.stringify(update)}`)
      await Transaction.query().where(where).update(update)
    } catch (e) {
      this.logger.error(`Update transaction error:`, e)
    }
  }

  async listAll({
    userId,
    paginationParams: { page, pageSize },
    filterParams,
    orderByDate
  }: ListAllTransactionsInput): Promise<Page<Transaction>> {
    if (page === 0) {
      await this.fetchCardTransactions(userId)
    }

    const filterParamsWithTableNames = prefixSomeObjectKeys(
      filterParams,
      ['walletAddressId', 'assetCode', 'type', 'status', 'accountId'],
      'transactions.'
    )

    const transactions = await Transaction.query()
      .select(
        'transactions.*',
        'walletAddress.url as walletAddressUrl',
        'walletAddress.publicName as walletAddressPublicName',
        'account.name as accountName',
        'account.assetScale'
      )
      .leftOuterJoinRelated('[walletAddress, account.user]')
      .whereNull('deletedAt')
      .where('account:user.id', userId)
      .where(filterParamsWithTableNames)
      .orderBy('transactions.createdAt', orderByDate)
      .page(page, pageSize)

    return transactions
  }

  async fetchCardTransactions(userId: string) {
    const key = `${FETCHING_TRANSACTIONS_KEY}-${userId}`
    if (this.cache.has(key)) {
      return
    }
    this.cache.set(key, true)

    const account = await Account.query().findOne({ userId, assetCode: 'EUR' })
    if (!account?.cardId) {
      return
    }

    const latestTransaction: Transaction | undefined = await Transaction.query()
      .findOne({ accountId: account.id, source: 'Card' })
      .orderBy('createdAt', 'DESC')

    const walletAddress = await WalletAddress.query().findOne({
      accountId: account.id,
      isCard: true
    })

    if (!walletAddress) {
      return
    }

    let page = 1
    const pageSize = 10
    let shouldFetchNext = true
    while (shouldFetchNext) {
      const transactionsResponse = await this.cardService.getCardTransactions(
        userId,
        account.cardId,
        pageSize,
        page
      )

      const newTransactions = transactionsResponse.data.filter(
        (transaction) =>
          transaction.transactionClassification !== 'Advice' &&
          (!latestTransaction ||
            latestTransaction.createdAt.toISOString() < transaction.createdAt)
      )

      if (newTransactions.length === 0) {
        return
      }

      if (transactionsResponse.data.length > newTransactions.length) {
        shouldFetchNext = false
      }

      page++

      const transactionsToSave: Partial<Transaction>[] = newTransactions.map(
        (transaction) => ({
          walletAddressId: walletAddress.id,
          accountId: walletAddress.accountId,
          paymentId: transaction.transactionId,
          assetCode: 'EUR',
          value: transformBalance(Number(transaction.billingAmount), 2),
          type: 'OUTGOING',
          status: 'COMPLETED',
          description: '',
          source: 'Card' as TransactionSource,
          secondParty: transaction.merchantName,
          txAmount: transaction.transactionAmount
            ? transformBalance(Number(transaction.transactionAmount), 2)
            : undefined,
          conversionRate: transaction.mastercardConversion?.convRate,
          txCurrency: transaction.transactionCurrency,
          cardTxType: transaction.type,
          createdAt: new Date(transaction.createdAt)
        })
      )

      await Transaction.query().insert(transactionsToSave)
    }
  }

  async processPendingIncomingPayments(): Promise<string | undefined> {
    return this.knex.transaction(async (trx) => {
      // Giving a Rafiki a little more time to process the payments before we process them.
      const now = new Date(Date.now() - 30_000)
      const [transaction] = await Transaction.query(trx)
        .limit(1)
        .forUpdate()
        .skipLocked()
        .where('status', '=', 'PENDING')
        .whereNotNull('expiresAt')
        .andWhere('expiresAt', '<=', now)

      if (!transaction) return
      await this.handleExpired(trx, transaction)

      return transaction.id
    })
  }

  async getSepaDetails({
    receiver,
    legalName
  }: SEPATransactionInput): Promise<SEPADetails> {
    const iban = receiver.split('/iban/')[1]
    return await this.gateHubClient.getSEPADetails(iban, legalName)
  }

  private async handleExpired(
    trx: Knex.Transaction,
    transaction: Transaction
  ): Promise<void> {
    await transaction.$query(trx).patch({
      status: 'EXPIRED'
    })
  }

  async createIncomingTransaction(
    params: IncomingPayment,
    walletAddress: WalletAddress
  ) {
    const amount = params.incomingAmount || params.receivedAmount
    return Transaction.query().insert({
      walletAddressId: params.walletAddressId,
      accountId: walletAddress.accountId,
      paymentId: params.id,
      assetCode: amount.assetCode,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
      value: amount.value,
      type: 'INCOMING',
      status: 'PENDING',
      description: params.metadata?.description,
      source: 'Interledger'
    })
  }

  async createOutgoingTransaction(
    params: OutgoingPayment,
    walletAddress: WalletAddress,
    secondParty?: ISecondParty
  ) {
    const existentTransaction = await Transaction.query().findOne({
      paymentId: params.id
    })
    if (existentTransaction) {
      return existentTransaction
    }

    const amount = params.debitAmount
    return Transaction.query().insert({
      walletAddressId: params.walletAddressId,
      accountId: walletAddress.accountId,
      paymentId: params.id,
      assetCode: amount.assetCode,
      value: amount.value,
      type: 'OUTGOING',
      status: 'PENDING',
      description: params.metadata?.description,
      secondParty: secondParty?.names,
      secondPartyWA: secondParty?.walletAddresses,
      source: 'Interledger'
    })
  }
}
