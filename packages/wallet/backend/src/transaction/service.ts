import { Transaction } from './model'
import { OrderByDirection, Page, PartialModelObject } from 'objection'
import { AccountService } from '@/account/service'
import { Logger } from 'winston'
import { PaginationQueryParams } from '@/shared/types'
import { prefixSomeObjectKeys } from '@/utils/helpers'

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
    const filterParamsWithTableNames = prefixSomeObjectKeys(
      filterParams,
      ['paymentPointerId', 'assetCode', 'type', 'status', 'accountId'],
      'transactions.'
    )

    const transactions = await Transaction.query()
      .select(
        'transactions.*',
        'paymentPointer.url as paymentPointerUrl',
        "paymentPointer.publicName as paymentPointerPublicName",
        'account.name as accountName',
        'account.assetScale'
      )
      .fullOuterJoinRelated('[paymentPointer, account.user]')
      .where('account:user.id', userId)
      .whereNotNull('transactions.id')
      .where(filterParamsWithTableNames)
      .orderBy('transactions.createdAt', orderByDate)
      .page(page, pageSize)

    return transactions
  }
}
