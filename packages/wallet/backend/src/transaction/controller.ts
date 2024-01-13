import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { Transaction } from '@/transaction/model'
import {
  transactionListAllRequestSchema,
  transactionListRequestSchema
} from '@/transaction/validation'
import { TransactionService } from '@/transaction/service'
import { Page } from 'objection'

interface ITransactionController {
  list: ControllerFunction<Transaction[]>
}

export class TransactionController implements ITransactionController {
  constructor(private transactionService: TransactionService) {}

  list = async (
    req: Request,
    res: CustomResponse<Transaction[]>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId, walletAddressId } = req.params
      const {
        query: { orderByDate }
      } = await validate(transactionListRequestSchema, req)

      const transactions = await this.transactionService.list(
        userId,
        accountId,
        walletAddressId,
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
    res: CustomResponse<Page<Transaction>>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        query: { page, pageSize, filter, orderByDate }
      } = await validate(transactionListAllRequestSchema, req)

      const filterParams = filter as Partial<Transaction>
      const transactions = await this.transactionService.listAll({
        userId,
        paginationParams: {
          page,
          pageSize
        },
        filterParams,
        orderByDate
      })
      res.status(200).json({
        success: true,
        message: 'SUCCESS',
        data: transactions
      })
    } catch (e) {
      next(e)
    }
  }
}
