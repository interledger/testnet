import { IFRAME_TYPE, IframeResponse } from '@wallet/shared/src'
import { GateHubClient } from '@/gatehub/client'
import { Controller, toSuccessResponse } from '@shared/backend'
import { NextFunction, Request } from 'express'

interface IGateHubController {
  getIframeUrl: Controller<IframeResponse>
}

export class GateHubController implements IGateHubController {
  constructor(private gateHubClient: GateHubClient) {}

  public getIframeUrl = async (
    req: Request,
    res: CustomResponse<IframeResponse>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const iframeType: IFRAME_TYPE = req.params.type as IFRAME_TYPE
      const url = this.gateHubClient.getIframeUrl(iframeType)
      res.status(200).json(toSuccessResponse({ url }))
    } catch (e) {
      next(e)
    }
  }
}
