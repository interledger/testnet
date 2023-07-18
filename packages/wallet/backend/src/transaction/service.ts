import { Transaction } from './model'
import { OrderByDirection, PartialModelObject } from 'objection'
import { AccountService } from '@/account/service'
import { Logger } from 'winston'
import { ObjectWithAnyKeys, PaginationQueryParams } from '@/shared/types'

type ListAllTransactionsInput = {
  userId: string
  paginationParams: PaginationQueryParams
  filterParams: Partial<Transaction>
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
  listAll: (
    input: ListAllTransactionsInput
  ) => Promise<PartialModelObject<Transaction>[]>
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
    filterParams
  }: ListAllTransactionsInput): Promise<PartialModelObject<Transaction>[]> {
    // "withGraphJoined" requires table names (eg: "id" is ambiguous)
    const filterParamsWithTablename: ObjectWithAnyKeys = Object.keys(
      filterParams
    ).reduce(
      (acc, oldKey) => ({
        ...acc,
        [`transactions.${oldKey}`]: (filterParams as ObjectWithAnyKeys)[oldKey]
      }),
      {}
    )

    const transactions = await Transaction.query()
      .withGraphJoined({ paymentPointer: { account: { user: true } } })
      .orderBy('createdAt', 'desc')
      .where('paymentPointer:account:user.id', userId)
      .where(filterParamsWithTablename)
      .page(page, pageSize)

    const transactionsWithoutPaymentPointer = transactions.results.map(
      (transaction: Partial<Transaction>) => {
        delete transaction.paymentPointer

        return transaction
      }
    )

    return transactionsWithoutPaymentPointer
  }
}
