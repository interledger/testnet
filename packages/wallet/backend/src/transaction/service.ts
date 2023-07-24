import { Transaction } from './model'
import { OrderByDirection, Page, PartialModelObject } from 'objection'
import { AccountService } from '@/account/service'
import { Logger } from 'winston'
import { ObjectWithAnyKeys, PaginationQueryParams } from '@/shared/types'
import { prefixSomeObjectKeys, replaceObjectKey } from '@/utils/helpers'

type ListAllTransactionsInput = {
  userId: string
  paginationParams: PaginationQueryParams
  filterParams: Partial<Transaction>
  orderByDate: OrderByDirection
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
  listAll: (input: ListAllTransactionsInput) => Promise<Page<Transaction>>
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
    paginationParams: { page, pageSize },
    filterParams,
    orderByDate
  }: ListAllTransactionsInput): Promise<Page<Transaction>> {
    let filterParamsWithTableNames: ObjectWithAnyKeys = prefixSomeObjectKeys(
      filterParams,
      ['paymentPointerId', 'assetCode', 'type', 'status'],
      'transactions.'
    )
    filterParamsWithTableNames = replaceObjectKey(
      filterParamsWithTableNames,
      'accountId',
      'paymentPointer:account.id'
    )

    const transactions = await Transaction.query()
      .select(
        'transactions.*',
        'paymentPointer.url as paymentPointerUrl',
        'paymentPointer:account.name as accountName'
      )
      .joinRelated('[paymentPointer.[account.user]]')
      .where('paymentPointer:account:user.id', userId)
      .where(
        'paymentPointer:account.id',
        'dd1d2e20-808c-497b-89ab-147baca49853'
      )
      .orderBy('transactions.createdAt', orderByDate)
      .where(filterParamsWithTableNames)
      .page(page, pageSize)

    return transactions
  }
}
