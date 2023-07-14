import { Transaction } from './model'
import { OrderByDirection, PartialModelObject } from 'objection'
import { AccountService } from '@/account/service'
import { Logger } from 'winston'
import { PaginationQueryParams } from '@/shared/types'

type ListAllTransactionsInput = {
  userId: string
  accountId: string
  paginationParams: PaginationQueryParams
}

interface ITransactionService {
  list: (
    userId: string,
    accountId: string,
    paymentPointerId: string,
    orderByDate: OrderByDirection
  ) => Promise<Transaction[]>
  updateTransaction: (
    where: PartialModelObject<Transaction>,
    update: PartialModelObject<Transaction>
  ) => Promise<void>
  listAll: (input: ListAllTransactionsInput) => Promise<Transaction[]>
}

interface TransactionServiceDependencies {
  accountService: AccountService
  logger: Logger
}

export class TransactionService implements ITransactionService {
  constructor(private deps: TransactionServiceDependencies) {}

  async list(
    userId: string,
    accountId: string,
    paymentPointerId: string,
    orderByDate: OrderByDirection
  ): Promise<Transaction[]> {
    await this.deps.accountService.findAccountById(accountId, userId)

    return Transaction.query()
      .where('paymentPointerId', paymentPointerId)
      .orderBy('createdAt', orderByDate)
  }

  async updateTransaction(
    where: PartialModelObject<Transaction>,
    update: PartialModelObject<Transaction>
  ): Promise<void> {
    try {
      this.deps.logger.info(
        `Updating transaction with: ${JSON.stringify(update)}`
      )
      await Transaction.query().where(where).update(update)
    } catch (e) {
      this.deps.logger.error(`Update transaction error:`, e)
    }
  }

  async listAll({
    userId,
    accountId,
    paginationParams: { page, pageSize }
  }: ListAllTransactionsInput): Promise<Transaction[]> {
    await this.deps.accountService.findAccountById(accountId, userId)

    const transactions = await Transaction.query()
      .orderBy('createdAt', 'desc')
      .page(page, pageSize)

    return transactions.results
  }
}
