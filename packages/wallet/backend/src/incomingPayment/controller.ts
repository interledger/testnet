import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import {
  incomingPaymentSchema,
  paymentDetailsSchema
} from '@/incomingPayment/validation'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { Controller, toSuccessResponse } from '@shared/backend'
import { PaymentDetailsResponse } from '@wallet/shared'

interface IIncomingPaymentController {
  create: Controller<{ url: string }>
  getPaymentDetailsByUrl: Controller<PaymentDetailsResponse>
}

export class IncomingPaymentController implements IIncomingPaymentController {
  constructor(private incomingPaymentService: IncomingPaymentService) {}

  create = async (
    req: Request,
    res: CustomResponse<{ url: string }>,
    next: NextFunction
  ) => {
    try {
      const {
        body: { walletAddress, incomingAmount, expiresAt, metadata }
      } = await validate(incomingPaymentSchema, req)

      const { openPaymentsUrl: url } = await this.incomingPaymentService.create(
        walletAddress,
        incomingAmount,
        expiresAt,
        metadata
      )
      res.status(200).json(toSuccessResponse({ url }))
    } catch (e) {
      next(e)
    }
  }

  getPaymentDetailsByUrl = async (
    req: Request,
    res: CustomResponse<PaymentDetailsResponse>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { url }
      } = await validate(paymentDetailsSchema, req)

      const paymentDetails =
        await this.incomingPaymentService.getPaymentDetailsByUrl(url)
      res.status(200).json(toSuccessResponse(paymentDetails))
    } catch (e) {
      next(e)
    }
  }
}
