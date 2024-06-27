import { Transaction, TransactionType } from './model'
import {
  OrderByDirection,
  Page,
  PartialModelObject,
  TransactionOrKnex
} from 'objection'
import { AccountService } from '@/account/service'
import { Logger } from 'winston'
import { PaginationQueryParams } from '@/shared/types'
import { prefixSomeObjectKeys } from '@/utils/helpers'
import { Knex } from 'knex'
import {
  IncomingPayment,
  OutgoingPayment
} from '@/rafiki/backend/generated/graphql'
import { WalletAddress } from '@/walletAddress/model'

type ListAllTransactionsInput = {
  userId: string
  paginationParams: PaginationQueryParams
  filterParams: Partial<Transaction>
  orderByDate: OrderByDirection
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
}

export class TransactionService implements ITransactionService {
  constructor(
    private accountService: AccountService,
    private logger: Logger,
    private knex: Knex
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
      description: params.metadata?.description
    })
  }

  async createOutgoingTransaction(
    params: OutgoingPayment,
    walletAddress: WalletAddress
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
      description: params.metadata?.description
    })
  }

  async sumByWalletAddressIdSince(
    walletAddressId: string,
    type: TransactionType,
    since: Date,
    trx?: TransactionOrKnex
  ) {
    //TODO updatedAt instead of createdAt?
    const transactions = await Transaction.query(trx)
      .where({
        walletAddressId,
        type,
        status: 'COMPLETED'
      })
      .andWhere('createdAt', '>', since)

    const ids = transactions.map(({ id }) => id)
    const sumResult = (await Transaction.query(trx)
      .whereIn('id', ids)
      .sum('value')) as unknown as [{ sum: bigint }]

    return {
      ids,
      sum: sumResult[0].sum ?? 0n
    }
  }
}
