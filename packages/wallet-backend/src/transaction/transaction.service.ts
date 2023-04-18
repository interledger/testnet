import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { TransactionModel } from './transaction.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'

export const listTransactions = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel[]>>,
  next: NextFunction
) => {
  try {
    const paymentPointerId = req.params.paymentPointerId
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId

    await findAccountById(accountId, userId)

    const transactions = await TransactionModel.query().where(
      'paymentPointerId',
      paymentPointerId
    )
    return res.json({ success: true, message: 'Success', data: transactions })
  } catch (e) {
    next(e)
  }
}
