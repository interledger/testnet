import { PaymentPointer } from '@/paymentPointer/model'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { ExternalPaymentPointer, PaymentPointerService } from './service'
import {
  externalPaymentPointerSchema,
  paymentPointerSchema,
  updatePaymentPointerSchema
} from './validation'

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

interface KeyPair {
  publicKey: string
  privateKey: string
  keyId: string
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

  getExternalPaymentPointer = async (
    req: Request,
    res: CustomResponse<ExternalPaymentPointer>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { url }
      } = await validate(externalPaymentPointerSchema, req)
      const externalPaymentPointer =
        await this.deps.paymentPointerService.getExternalPaymentPointer(url)
      res.status(200).json({
        success: true,
        message: 'SUCCESS',
        data: externalPaymentPointer
      })
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

      res.status(200).json({
        success: true,
        message: 'Payment pointer was successfully deleted'
      })
    } catch (e) {
      next(e)
    }
  }

  registerKey = async (
    req: Request,
    res: CustomResponse<KeyPair>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId, paymentPointerId } = req.params

      const { privateKey, publicKey, keyId } =
        await this.deps.paymentPointerService.registerKey(
          userId,
          accountId,
          paymentPointerId
        )

      res.status(200).json({
        success: true,
        message: 'Public key is successfully registered',
        data: { privateKey, publicKey, keyId }
      })
    } catch (e) {
      next(e)
    }
  }

  revokeKey = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { accountId, paymentPointerId } = req.params

      await this.deps.paymentPointerService.revokeKey(
        req.session.user.id,
        accountId,
        paymentPointerId
      )

      res.status(200).json({
        success: true,
        message: 'Key was successfully revoked.'
      })
    } catch (e) {
      this.deps.logger.error(e)
      next(e)
    }
  }

  update = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { accountId, paymentPointerId } = req.params

      const {
        body: { publicName }
      } = await validate(updatePaymentPointerSchema, req)

      await this.deps.paymentPointerService.update({
        userId: req.session.user.id,
        accountId,
        paymentPointerId,
        publicName
      })

      res.status(200).json({
        success: true,
        message: 'Payment pointer was successfully updated.'
      })
    } catch (e) {
      this.deps.logger.error(e)
      next(e)
    }
  }
}
