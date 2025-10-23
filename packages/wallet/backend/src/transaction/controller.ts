import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { Transaction } from '@/transaction/model'
import {
  transactionListAllRequestSchema,
  transactionListRequestSchema
} from '@/transaction/validation'
import { TransactionService } from '@/transaction/service'
import { Controller, toSuccessResponse } from '@shared/backend'
import { TransactionsPageResponse } from '@wallet/shared'
import { sepaDetailsSchema } from '@/incomingPayment/validation'

export type SepaResponse = {
  vop: {
    description: string
    nonce: string
    match: string
  }
}

interface ITransactionController {
  list: Controller<Transaction[]>
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
      res.status(200).json(toSuccessResponse(transactions))
    } catch (e) {
      next(e)
    }
  }

  listAll = async (
    req: Request,
    res: CustomResponse<TransactionsPageResponse>,
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
      res.status(200).json(toSuccessResponse(transactions))
    } catch (e) {
      next(e)
    }
  }

  sepaTransaction = async (
    req: Request,
    res: CustomResponse<SepaResponse>,
    next: NextFunction
  ) => {
    try {
      const {
        body: { receiver, legalName }
      } = await validate(sepaDetailsSchema, req)
      const sepaDetails = await this.transactionService.getSepaDetails({
        receiver,
        legalName
      })

      res.status(200).json(toSuccessResponse(sepaDetails))
    } catch (e) {
      next(e)
    }
  }
}
