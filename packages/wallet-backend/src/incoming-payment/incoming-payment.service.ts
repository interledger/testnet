import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import {
  incomingPaymentSchema,
  paymentDetailsSchema
} from './incoming-payment.schema'
import { PaymentPointerModel } from '../payment-pointer/payment-pointer.model'
import { getAsset } from '../rafiki/request/asset.request'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { createIncomingPayment } from '../rafiki/request/incoming-payment.request'
import { TransactionModel } from '../transaction/transaction.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { findAccountById } from '../account/account.service'
import { Asset } from '../rafiki/generated/graphql'
import { transformAmount } from '../utils/helpers'

interface PaymentDetails {
  value: number
  description?: string
}

export const createPayment = async (
  req: Request,
  res: Response<BaseResponse<TransactionModel>>,
  next: NextFunction
) => {
  try {
    const { paymentPointerId, amount, description } = await zParse(
      incomingPaymentSchema,
      req
    )

    const userId = getUserIdFromRequest(req)
    const existingPaymentPointer = await PaymentPointerModel.query().findById(
      paymentPointerId
    )
    if (!existingPaymentPointer || !existingPaymentPointer.active) {
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
      BigInt(amount * 10 ** asset.scale),
      asset,
      description
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

export const getPayment = async (
  req: Request,
  res: Response<BaseResponse<PaymentDetails>>,
  next: NextFunction
) => {
  try {
    const { url } = await zParse(paymentDetailsSchema, req, 'query')
    const id = extractUuidFromUrl(url)

    const transaction = await TransactionModel.query()
      .where('paymentId', id)
      .where('status', 'PENDING')
      .first()
      .withGraphFetched({ paymentPointer: { account: true } })

    if (!transaction) {
      throw new NotFoundException(
        'The provided incoming payment URL could not be found.'
      )
    }

    const asset = await getAsset(
      transaction.paymentPointer?.account.assetRafikiId
    )
    if (!asset) {
      throw new NotFoundException()
    }

    return res.json({
      success: true,
      message: 'Success',
      data: {
        description: transaction.description,
        value: transformAmount(transaction.value ?? 0, asset.scale)
      }
    })
  } catch (e) {
    next(e)
  }
}

export async function createIncomingPaymentTransactions(
  paymentPointerId: string,
  amount: bigint | null,
  asset: Asset,
  description?: string,
  expiresAt?: string
): Promise<TransactionModel> {
  const response = await createIncomingPayment(
    paymentPointerId,
    amount,
    asset,
    description,
    expiresAt
  )

  return TransactionModel.query().insert({
    paymentPointerId: paymentPointerId,
    paymentId: response.id,
    assetCode: asset.code,
    value: amount,
    type: 'INCOMING',
    status: 'PENDING',
    description
  })
}

function extractUuidFromUrl(url: string): string {
  const { pathname } = new URL(url)
  const id = pathname.match(
    /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
  )?.[0]

  if (!id) {
    throw new Error('Uuid is not present in url')
  }

  return id
}
