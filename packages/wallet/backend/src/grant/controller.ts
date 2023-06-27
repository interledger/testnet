import { NextFunction, Request } from 'express'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { Grant } from '@/rafiki/auth/generated/graphql'
import { PaymentPointerService } from '@/paymentPointer/service'

interface IGrantController {
  list: ControllerFunction<Grant[]>
  getById: ControllerFunction<Grant>
  revoke: ControllerFunction<void>
}
interface GrantControllerDependencies {
  rafikiAuthService: RafikiAuthService
  paymentPointerService: PaymentPointerService
}

export class GrantController implements IGrantController {
  constructor(private deps: GrantControllerDependencies) {}

  list = async (
    req: Request,
    res: CustomResponse<Grant[]>,
    next: NextFunction
  ) => {
    try {
      const identifiers =
        await this.deps.paymentPointerService.listIdentifiersByUserId(
          req.session.user.id
        )
      const grants = await this.deps.rafikiAuthService.listGrants(identifiers)
      res.json({ success: true, message: 'Success', data: grants })
    } catch (e) {
      next(e)
    }
  }

  revoke = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      await this.deps.rafikiAuthService.revokeGrant(req.params.id)

      res.json({ success: true, message: 'Success' })
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<Grant>,
    next: NextFunction
  ) => {
    try {
      const grant = await this.deps.rafikiAuthService.getGrantById(
        req.params.id
      )

      res.json({ success: true, message: 'Success', data: grant })
    } catch (e) {
      next(e)
    }
  }
}
