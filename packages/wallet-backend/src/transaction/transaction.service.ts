import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { TransactionModel } from './transaction.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'
import { PartialModelObject } from 'objection'
import { zParse } from '../middlewares/validator'
import { transactionListRequestSchema } from './transaction.schema'

export const listTransactions = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel[]>>,
  next: NextFunction
) => {
  try {
    const { orderByDate } = await zParse(
      transactionListRequestSchema,
      req,
      'query'
    )

    const paymentPointerId = req.params.paymentPointerId
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId

    await findAccountById(accountId, userId)

    const transactions = await TransactionModel.query()
      .where('paymentPointerId', paymentPointerId)
      .orderBy('createdAt', orderByDate)

    return res.json({ success: true, message: 'Success', data: transactions })
  } catch (e) {
    next(e)
  }
}

export const updateTransaction = async (
  where: PartialModelObject<TransactionModel>,
  update: PartialModelObject<TransactionModel>
) => {
  try {
    console.log(`Updating transaction with: ${JSON.stringify(update)}`)
    return await TransactionModel.query().where(where).update(update)
  } catch (e) {
    console.log(`Update transaction error:`, e)
  }
}
