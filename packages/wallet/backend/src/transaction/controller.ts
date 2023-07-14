import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { Transaction } from '@/transaction/model'
import {
  transactionListAllRequestSchema,
  transactionListRequestSchema
} from '@/transaction/validation'
import { TransactionService } from '@/transaction/service'

interface ITransactionController {
  list: ControllerFunction<Transaction[]>
}
interface TransactionControllerDependencies {
  transactionService: TransactionService
}

export class TransactionController implements ITransactionController {
  constructor(private deps: TransactionControllerDependencies) {}

  list = async (
    req: Request,
    res: CustomResponse<Transaction[]>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId, paymentPointerId } = req.params
      const {
        query: { orderByDate }
      } = await validate(transactionListRequestSchema, req)

      const transactions = await this.deps.transactionService.list(
        userId,
        accountId,
        paymentPointerId,
        orderByDate
      )
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: transactions })
    } catch (e) {
      next(e)
    }
  }

  listAll = async (
    req: Request,
    res: CustomResponse<Transaction[]>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId } = req.params

      const {
        query: { page, pageSize }
      } = await validate(transactionListAllRequestSchema, req)

      const transactions = await this.deps.transactionService.listAll({
        userId,
        accountId,
        paginationParams: {
          page: Number(page),
          pageSize: Number(pageSize)
        }
      })
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: transactions })
    } catch (e) {
      next(e)
    }
  }
}
