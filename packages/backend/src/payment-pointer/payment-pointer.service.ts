import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { paymentPointerSchema } from './payment-pointer.schema'
import { createRafikiPaymentPointer } from '../rafiki/request/payment-pointer.request'
import { PaymentPointerModel } from './payment-pointer.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'
import { NotFoundException } from '../shared/models/errors/NotFoundException'

export const createPaymentPointer = async (
  req: Request,
  res: Response<BaseResponse<PaymentPointerModel>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId
    const { publicName } = await zParse(paymentPointerSchema, req)
    const account = await findAccountById(accountId, userId)

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
    const account = await findAccountById(accountId, userId)

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
    await findAccountById(accountId, userId)

    const paymentPointer = await PaymentPointerModel.query()
      .findById(id)
      .where('accountId', accountId)

    if (!paymentPointer) {
      throw new NotFoundException()
    }

    return res.json({ success: true, message: 'Success', data: paymentPointer })
  } catch (e) {
    next(e)
  }
}
