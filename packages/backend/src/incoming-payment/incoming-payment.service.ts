import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { incomingPaymentSchema } from './incoming-payment.schema'
import { PaymentPointerModel } from '../payment-pointer/payment-pointer.model'
import { getAsset } from '../rafiki/request/asset.request'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { createIncomingPayment } from '../rafiki/request/incoming-payment.request'
import { TransactionModel } from '../transaction/transaction.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'
import { Asset } from '../rafiki/generated/graphql'

export const createPayment = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel>>,
  next: NextFunction
) => {
  try {
    const { paymentPointerId, amount } = await zParse(
      incomingPaymentSchema,
      req
    )

    const userId = getUserIdFromRequest(req)
    const existingPaymentPointer = await PaymentPointerModel.query().findById(
      paymentPointerId
    )
    if (!existingPaymentPointer) {
      throw new NotFoundException()
    }

    const { assetRafikiId } = await findAccountById(
      existingPaymentPointer.accountId,
      userId
    )
    const asset = await getAsset(assetRafikiId)
    if (!asset) {
      throw new NotFoundException()
    }

    const transaction = await createIncomingPaymentTransactions(
      paymentPointerId,
      amount * 10 ** asset.scale,
      asset
    )

    return res.json({
      success: true,
      message: 'Incoming payment created',
      data: transaction
    })
  } catch (e) {
    next(e)
  }
}

export async function createIncomingPaymentTransactions(
  paymentPointerId: string,
  amount: number,
  asset: Asset
): Promise<TransactionModel> {
  const response = await createIncomingPayment(paymentPointerId, amount, asset)

  return TransactionModel.query().insert({
    paymentPointerId: paymentPointerId,
    paymentId: response.id,
    assetCode: asset.code,
    value: amount,
    type: 'INCOMING',
    status: 'PENDING'
  })
}
