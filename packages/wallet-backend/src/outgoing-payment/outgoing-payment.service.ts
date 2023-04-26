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
import { findAccountById, getAccountBalance } from '../account/account.service'
import { createOutgoingPayment } from '../rafiki/request/outgoing-payment.request'
import { createQuote } from '../rafiki/request/quote.request'
import { Asset } from '../rafiki/generated/graphql'
import { createIncomingPaymentTransactions } from '../incoming-payment/incoming-payment.service'

export const createPayment = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel>>,
  next: NextFunction
) => {
  try {
    const {
      incomingPaymentUrl,
      toPaymentPointerUrl,
      paymentPointerId,
      amount,
      isReceive,
      description
    } = await zParse(outgoingPaymentSchema, req)

    if (!incomingPaymentUrl && !toPaymentPointerUrl) {
      throw new BadRequestException(
        'incomingPaymentUrl or toPaymentPointerUrl should be defined'
      )
    }

    const userId = getUserIdFromRequest(req)
    const existingPaymentPointer = await PaymentPointerModel.query().findById(
      paymentPointerId
    )
    if (!existingPaymentPointer || !existingPaymentPointer.active) {
      throw new BadRequestException('Invalid payment pointer')
    }

    const { assetRafikiId, assetCode } = await findAccountById(
      existingPaymentPointer.accountId,
      userId
    )
    const balance = await getAccountBalance(userId, assetCode)

    if (parseFloat(balance) < amount) {
      throw new BadRequestException('Not enough funds in account')
    }

    const asset = await getAsset(assetRafikiId)
    if (!asset) {
      throw new NotFoundException()
    }

    const paymentUrl: string =
      incomingPaymentUrl ||
      (await createReceiver(
        isReceive ? BigInt(amount * 10 ** asset.scale) : null,
        asset,
        toPaymentPointerUrl,
        description,
        new Date(Date.now() + 1000 * 60).toISOString()
      ))

    const quote = await createQuote(
      paymentPointerId,
      paymentUrl,
      asset,
      isReceive ? undefined : BigInt(amount * 10 ** asset.scale)
    )
    const payment = await createOutgoingPayment(
      paymentPointerId,
      quote.id,
      description
    )

    const transaction = await TransactionModel.query().insert({
      paymentPointerId: existingPaymentPointer.id,
      paymentId: payment.id,
      assetCode: asset.code,
      value: BigInt(amount * 10 ** asset.scale),
      type: 'OUTGOING',
      status: 'PENDING',
      description
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
  amount: bigint | null,
  asset: Asset,
  paymentPointerUrl = '',
  description?: string,
  expiresAt?: string
): Promise<string> {
  const existingPaymentPointer = await PaymentPointerModel.query().findOne({
    url: paymentPointerUrl
  })
  if (!existingPaymentPointer) {
    throw new BadRequestException('Invalid payment pointer')
  }

  const response = await createIncomingPaymentTransactions(
    existingPaymentPointer.id,
    amount,
    asset,
    description,
    expiresAt
  )

  return `${existingPaymentPointer.url}/incoming-payments/${response.paymentId}`
}
