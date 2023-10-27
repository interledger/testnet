import { NextFunction, Request } from 'express'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { Grant } from '@/rafiki/auth/generated/graphql'
import { WalletAddressService } from '@/walletAddress/service'
import { validate } from '@/shared/validate'
import { grantResponseSchema } from '@/grant/validation'
import { GrantService } from '@/grant/service'

interface IGrantController {
  list: ControllerFunction<Grant[]>
  getById: ControllerFunction<Grant>
  revoke: ControllerFunction<void>
  getByInteraction: ControllerFunction<Grant>
  setInteractionResponse: ControllerFunction<Grant>
}
interface GrantControllerDependencies {
  rafikiAuthService: RafikiAuthService
  walletAddressService: WalletAddressService
  grantService: GrantService
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
        await this.deps.walletAddressService.listIdentifiersByUserId(
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

  getByInteraction = async (
    req: Request,
    res: CustomResponse<Grant>,
    next: NextFunction
  ) => {
    try {
      const grant = await this.deps.grantService.getGrantByInteraction(
        req.session.user.id,
        req.params.interactionId,
        req.params.nonce
      )

      res.json({ success: true, message: 'Success', data: grant })
    } catch (e) {
      next(e)
    }
  }

  setInteractionResponse = async (
    req: Request,
    res: CustomResponse<Grant>,
    next: NextFunction
  ) => {
    try {
      const {
        body: { response }
      } = await validate(grantResponseSchema, req)

      const grant = await this.deps.grantService.setInteractionResponse(
        req.session.user.id,
        req.params.interactionId,
        req.params.nonce,
        response
      )

      res.json({ success: true, message: 'Success', data: grant })
    } catch (e) {
      next(e)
    }
  }
}
