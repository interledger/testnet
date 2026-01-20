import { IFRAME_TYPE, IframeResponse } from '@wallet/shared/src'
import { Controller, toSuccessResponse } from '@shared/backend'
import { NextFunction, Request } from 'express'
import { GateHubService } from '@/gatehub/service'

interface IGateHubController {
  getIframeUrl: Controller<IframeResponse>
  addUserToGateway: Controller
}

export class GateHubController implements IGateHubController {
  constructor(private gateHubService: GateHubService) {}

  public getIframeUrl = async (
    req: Request,
    res: CustomResponse<IframeResponse>,
    next: NextFunction
  ) => {
    try {
      console.log('[GATEHUB-CTRL] getIframeUrl called')
      console.log('[GATEHUB-CTRL] session:', {
        hasSession: Boolean((req as any)?.session),
        sessionId: (req as any)?.session?.id,
        hasUser: Boolean((req as any)?.session?.user),
        userId: (req as any)?.session?.user?.id
      })
      console.log('[GATEHUB-CTRL] type:', req.params.type)
      
      const userId = req.session.user.id
      const iframeType: IFRAME_TYPE = req.params.type as IFRAME_TYPE
      const { url, isApproved, customerId } =
        await this.gateHubService.getIframeUrl(iframeType, userId)

      console.log('[GATEHUB-CTRL] getIframeUrl result:', { url, isApproved, customerId })

      if (isApproved) {
        req.session.user.needsIDProof = false

        if (customerId) {
          req.session.user.customerId = customerId
        }

        await req.session.save()
      }
      res.status(200).json(toSuccessResponse({ url }))
    } catch (e) {
      console.error('[GATEHUB-CTRL] getIframeUrl error:', (e as any)?.message, (e as any)?.stack)
      next(e)
    }
  }

  public addUserToGateway = async (
    req: Request,
    res: CustomResponse<IframeResponse>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { isApproved, customerId } =
        await this.gateHubService.addUserToGateway(userId)

      if (isApproved) {
        req.session.user.needsIDProof = false
      }

      if (customerId) {
        req.session.user.customerId = customerId
      }

      await req.session.save()
      res.status(200).json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }

  public webhook = async (
    req: Request,
    res: CustomResponse<IframeResponse>,
    next: NextFunction
  ) => {
    try {
      if (!req.body.uuid) {
        res.status(200).json()
        return
      }

      await this.gateHubService.handleWebhook(req.body)

      res.status(200).json()
    } catch (e) {
      next(e)
    }
  }
}
