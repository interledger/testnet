import { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { grantResponseSchema, grantListRequestSchema } from '@/grant/validation'
import { GrantService } from '@/grant/service'
import { Controller, toSuccessResponse } from '@shared/backend'
import { GrantResponse, GrantsListResponse } from '@wallet/shared'
import { Grant as RhyzaGrant } from '@/rhyza/types'

interface IGrantController {
  listWithPagination: Controller<GrantsListResponse>
  getById: Controller<GrantResponse>
  revoke: Controller<void>
  getByInteraction: Controller<RhyzaGrant>
  setInteractionResponse: Controller<void>
}

export class GrantController implements IGrantController {
  constructor(private grantService: GrantService) {}

  listWithPagination = async (
    req: Request,
    res: CustomResponse<GrantsListResponse>,
    next: NextFunction
  ) => {
    try {
      const { body } = await validate(grantListRequestSchema, req)

      const grants = await this.grantService.listWithPagination(
        req.session.user.id,
        body
      )
      res.json(toSuccessResponse(grants))
    } catch (e) {
      next(e)
    }
  }

  revoke = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      await this.grantService.revoke(req.session.user.id, req.params.id)

      res.json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<GrantResponse>,
    next: NextFunction
  ) => {
    try {
      const grant = await this.grantService.getById(
        req.session.user.id,
        req.params.id
      )

      res.json(toSuccessResponse(grant))
    } catch (e) {
      next(e)
    }
  }

  getByInteraction = async (
    req: Request,
    res: CustomResponse<GrantResponse>,
    next: NextFunction
  ) => {
    try {
      const grant = await this.grantService.getGrantByInteraction(
        req.session.user.id,
        req.params.interactionId,
        req.params.nonce
      )

      res.json(toSuccessResponse(grant))
    } catch (e) {
      next(e)
    }
  }

  setInteractionResponse = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { response }
      } = await validate(grantResponseSchema, req)

      await this.grantService.setInteractionResponse(
        req.session.user.id,
        req.params.interactionId,
        req.params.nonce,
        response
      )

      res.json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }
}
