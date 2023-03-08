import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { paymentPointerSchema } from './payment-pointer.schema'
import { Account } from '../account/account.model'
import { createRafikiPaymentPointer } from '../rafiki/request/payment-pointer.request'
import { PaymentPointerModel } from './payment-pointer.model'
import { getUserIdFromRequest } from '../utils/getUserId'

export const createPaymentPointer = async (
  req: Request,
  res: Response<BaseResponse<PaymentPointerModel>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId
    const { publicName } = await zParse(paymentPointerSchema, req)
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)
      .throwIfNotFound()

    const rafikiPaymentPointer = await createRafikiPaymentPointer(
      publicName,
      account.assetRafikiId
    )
    const paymentPointer = await PaymentPointerModel.query().insert({
      publicName,
      accountId,
      id: rafikiPaymentPointer.id
    })

    return res.json({
      success: true,
      message: 'Payment pointer created',
      data: paymentPointer
    })
  } catch (e) {
    next(e)
  }
}
export const listPaymentPointers = async (
  req: Request,
  res: Response<BaseResponse<PaymentPointerModel[]>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId
    // Validate that account id belongs to current user
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)
      .throwIfNotFound()

    const paymentPointers = await PaymentPointerModel.query().where(
      'accountId',
      account.id
    )

    return res.json({
      success: true,
      message: 'Success',
      data: paymentPointers
    })
  } catch (e) {
    next(e)
  }
}
export const getPaymentPointerById = async (
  req: Request,
  res: Response<BaseResponse<PaymentPointerModel>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId
    const id = req.params.id
    // Validate that account id belongs to current user
    await Account.query()
      .findById(accountId)
      .where('userId', userId)
      .throwIfNotFound()

    const paymentPointer = await PaymentPointerModel.query()
      .findById(id)
      .where('accountId', accountId)
      .throwIfNotFound()

    return res.json({ success: true, message: 'Success', data: paymentPointer })
  } catch (e) {
    next(e)
  }
}
