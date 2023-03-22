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
import { Asset } from '../rafiki/generated/graphql'
import { createIncomingPayment } from '../rafiki/request/incoming-payment.request'

export const createPayment = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel>>,
  next: NextFunction
) => {
  try {
    const {
      incomingPaymentUrl,
      toPaymentPointerId,
      paymentPointerId,
      amount,
      isReceive
    } = await zParse(outgoingPaymentSchema, req)

    if (!incomingPaymentUrl && !toPaymentPointerId) {
      throw new BadRequestException(
        'incomingPaymentUrl or toPaymentPointerId shoudl be defined'
      )
    }

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

    const paymentUrl: string =
      incomingPaymentUrl ||
      (await createReceiver(amount, asset, toPaymentPointerId))

    const quote = await createQuote(
      paymentPointerId,
      paymentUrl,
      amount,
      asset,
      isReceive
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

async function createReceiver(
  amount: number,
  asset: Asset,
  paymentPointerId = ''
): Promise<string> {
  const existingPaymentPointer = await PaymentPointerModel.query().findById(
    paymentPointerId
  )
  if (!existingPaymentPointer) {
    throw new BadRequestException('Invalid payment pointer')
  }

  const response = await createIncomingPayment(paymentPointerId, amount, asset)

  return `${existingPaymentPointer.url}/incoming-payments/${response.id}`
}
