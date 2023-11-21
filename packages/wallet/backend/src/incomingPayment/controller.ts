import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import {
  incomingPaymentSchema,
  paymentDetailsSchema
} from '@/incomingPayment/validation'
import { IncomingPaymentService } from '@/incomingPayment/service'

export interface PaymentDetails {
  value: number
  description?: string
  assetCode: string
}

interface IIncomingPaymentController {
  create: ControllerFunction<{ url: string }>
  getPaymentDetailsByUrl: ControllerFunction<PaymentDetails>
}
interface IncomingPaymentControllerDependencies {
  incomingPaymentService: IncomingPaymentService
}

export class IncomingPaymentController implements IIncomingPaymentController {
  constructor(private deps: IncomingPaymentControllerDependencies) {}

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

      const url = await this.deps.incomingPaymentService.create(
        userId,
        walletAddressId,
        amount,
        description,
        expiration
      )
      res.status(200).json({ success: true, message: 'SUCCESS', data: { url } })
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
        await this.deps.incomingPaymentService.getPaymentDetailsByUrl(url)
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: paymentDetails })
    } catch (e) {
      next(e)
    }
  }
}
