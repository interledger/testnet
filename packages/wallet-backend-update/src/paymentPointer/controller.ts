import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { validate } from '@/shared/validate'
import { PaymentPointerService } from './service'
import { paymentPointerSchema } from './validation'
import { PaymentPointer } from '@/paymentPointer/model'

interface IPaymentPointerController {
  create: ControllerFunction<PaymentPointer>
  list: ControllerFunction<PaymentPointer[]>
  getById: ControllerFunction<PaymentPointer>
  softDelete: ControllerFunction
}
interface PaymentPointerControllerDependencies {
  paymentPointerService: PaymentPointerService
  logger: Logger
}

export class PaymentPointerController implements IPaymentPointerController {
  constructor(private deps: PaymentPointerControllerDependencies) {}

  create = async (
    req: Request,
    res: CustomResponse<PaymentPointer>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId } = req.params
      const {
        body: { paymentPointerName, publicName }
      } = await validate(paymentPointerSchema, req)

      const paymentPointer = await this.deps.paymentPointerService.create(
        userId,
        accountId,
        paymentPointerName,
        publicName
      )
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: paymentPointer })
    } catch (e) {
      next(e)
    }
  }

  list = async (
    req: Request,
    res: CustomResponse<PaymentPointer[]>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const { accountId } = req.params

    try {
      const paymentPointers = await this.deps.paymentPointerService.list(
        userId,
        accountId
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: paymentPointers })
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<PaymentPointer>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const { accountId, id } = req.params

    try {
      const paymentPointer = await this.deps.paymentPointerService.getById(
        userId,
        accountId,
        id
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: paymentPointer })
    } catch (e) {
      next(e)
    }
  }

  softDelete = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { id } = req.params

      await this.deps.paymentPointerService.softDelete(userId, id)

      res
        .status(200)
        .json({
          success: true,
          message: 'Payment pointer was successfully deleted'
        })
    } catch (e) {
      next(e)
    }
  }
}
