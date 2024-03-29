import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import {
  incomingPaymentSchema,
  paymentDetailsSchema
} from '@/incomingPayment/validation'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { Controller, toSuccessResponse } from '@shared/backend'

export interface PaymentDetails {
  value: number
  description?: string
  assetCode: string
}

interface IIncomingPaymentController {
  create: Controller<{ url: string }>
  getPaymentDetailsByUrl: Controller<PaymentDetails>
}

export class IncomingPaymentController implements IIncomingPaymentController {
  constructor(private incomingPaymentService: IncomingPaymentService) {}

  create = async (
    req: Request,
    res: CustomResponse<{ url: string }>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { walletAddressId, amount, description, expiration }
      } = await validate(incomingPaymentSchema, req)

      const url = await this.incomingPaymentService.create(
        userId,
        walletAddressId,
        amount,
        description,
        expiration
      )
      res.status(200).json(toSuccessResponse({ url }))
    } catch (e) {
      next(e)
    }
  }

  getPaymentDetailsByUrl = async (
    req: Request,
    res: CustomResponse<PaymentDetails>,
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
