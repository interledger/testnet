import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { paymentPointerSchema } from './payment-pointer.schema'
import { createRafikiPaymentPointer } from '../rafiki/request/payment-pointer.request'
import { PaymentPointerModel } from './payment-pointer.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import env from '../config/env'
import { ConflictException } from '../shared/models/errors/ConflictException'

export const createPaymentPointer = async (
  req: Request,
  res: Response<BaseResponse<PaymentPointerModel>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.accountId
    const { paymentPointerName, publicName } = await zParse(
      paymentPointerSchema,
      req
    )
    const account = await findAccountById(accountId, userId)
    let paymentPointer = await PaymentPointerModel.query().findOne({
      url: `${env.OPEN_PAYMENTS_HOST}/${paymentPointerName}`
    })

    if (paymentPointer) {
      if (paymentPointer.accountId != accountId || account.userId !== userId) {
        throw new ConflictException(
          'This payment pointer already exists. Please choose another name.'
        )
      } else if (
        paymentPointer.accountId === accountId &&
        account.userId === userId
      ) {
        paymentPointer = await PaymentPointerModel.query().patchAndFetchById(
          paymentPointer.id,
          {
            publicName,
            isActive: true
          }
        )
      }
    } else {
      const rafikiPaymentPointer = await createRafikiPaymentPointer(
        paymentPointerName,
        publicName,
        account.assetRafikiId
      )

      paymentPointer = await PaymentPointerModel.query().insert({
        url: rafikiPaymentPointer.url,
        publicName,
        accountId,
        id: rafikiPaymentPointer.id
      })
    }

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

    const paymentPointers = await PaymentPointerModel.query()
      .where('accountId', account.id)
      .where('isActive', true)

    return res.json({
      success: true,
      message: 'Success',
      data: paymentPointers
    })
  } catch (e) {
    next(e)
  }
}

/**
 * This is a soft delete functionality. The payment pointer will never be
 * deleted. We will change it's `isActive` column to `false` when the user
 * wants to delete it.
 * */
export const deletePaymentPointer = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const id = req.params.id

    const paymentPointer = await PaymentPointerModel.query().findById(id)

    if (!paymentPointer) {
      throw new NotFoundException()
    }

    // Check if the user owns the payment pointer.
    // This function throws a NotFoundException.
    await findAccountById(paymentPointer.accountId, userId)
    await PaymentPointerModel.query().findById(id).patch({
      isActive: false
    })

    return res.json({
      success: true,
      message: 'Payment pointer was successfully deleted'
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
      .where('isActive', true)

    if (!paymentPointer) {
      throw new NotFoundException()
    }

    return res.json({ success: true, message: 'Success', data: paymentPointer })
  } catch (e) {
    next(e)
  }
}
