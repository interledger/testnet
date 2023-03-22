import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { PaymentPointerModel } from '../payment-pointer/payment-pointer.model'
import { BadRequestException } from '../shared/models/errors/BadRequestException'
import { getAsset } from '../rafiki/request/asset.request'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { outgoingPaymentSchema } from './outgoing-payment.schema'
import { TransactionModel } from '../transaction/transaction.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'
import { createOutgoingPayment } from '../rafiki/request/outgoing-payment.request'
import { createQuote } from '../rafiki/request/quote.request'

export const createPayment = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel>>,
  next: NextFunction
) => {
  try {
    const { incomingPaymentUrl, paymentPointerId, amount } = await zParse(
      outgoingPaymentSchema,
      req
    )

    const userId = getUserIdFromRequest(req)
    const existingPaymentPointer = await PaymentPointerModel.query().findById(
      paymentPointerId
    )
    if (!existingPaymentPointer) {
      throw new BadRequestException('Invalid payment pointer')
    }

    const { assetRafikiId } = await findAccountById(
      existingPaymentPointer.accountId,
      userId
    )
    const asset = await getAsset(assetRafikiId)
    if (!asset) {
      throw new NotFoundException()
    }

    const quote = await createQuote(
      paymentPointerId,
      incomingPaymentUrl,
      amount,
      asset
    )
    const payment = await createOutgoingPayment(paymentPointerId, quote.id)

    const transaction = await TransactionModel.query().insert({
      paymentPointerId: existingPaymentPointer.id,
      paymentId: payment.id,
      assetCode: asset.code,
      value: amount,
      type: 'OUTGOING',
      status: 'PENDING'
    })

    return res.json({
      success: true,
      message: 'Outgoing payment created',
      data: transaction
    })
  } catch (e) {
    next(e)
  }
}
