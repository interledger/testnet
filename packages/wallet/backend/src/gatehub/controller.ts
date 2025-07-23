import { IFRAME_TYPE, IframeResponse } from '@wallet/shared/src'
import { Controller, NotFound, toSuccessResponse } from '@shared/backend'
import { NextFunction, Request } from 'express'
import { GateHubService } from '@/gatehub/service'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import axios from 'axios'

interface IGateHubController {
  getIframeUrl: Controller<IframeResponse>
  addUserToGateway: Controller
}

export class GateHubController implements IGateHubController {
  constructor(
    private gateHubService: GateHubService,
    private logger: Logger,
    private env: Env
  ) {}

  public getIframeUrl = async (
    req: Request,
    res: CustomResponse<IframeResponse>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const iframeType: IFRAME_TYPE = req.params.type as IFRAME_TYPE
      const { url, isApproved, customerId } =
        await this.gateHubService.getIframeUrl(iframeType, userId)

      if (isApproved) {
        req.session.user.needsIDProof = false

        if (customerId) {
          req.session.user.customerId = customerId
        }

        await req.session.save()
      }
      res.status(200).json(toSuccessResponse({ url }))
    } catch (e) {
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
      //==========================
      // ONLY TEMPORARY - added to forward webhooks to the wallet
      // wallet and cards share the same Gatehub account witch in turn means
      // they share the same webhook -> if no user is found in cards send to wallet
      await this.sendMessageToWallet(e, req, next)
      //===================
      next(e)
    }
  }

  private async sendMessageToWallet(
    e: unknown,
    req: Request,
    next: NextFunction
  ) {
    const url = this.env.WALLET_WEBHOOK_FORWARD_URL
    if (!url) {
      this.logger.warn('No wallet webhook forwarding URL configured')
    }
    if (e instanceof NotFound && url)
      try {
        await axios.post(url, req.body, {
          headers: {
            'x-gh-webhook-signature': req.get('x-gh-webhook-signature'),
            'x-gh-webhook-timestamp': req.get('x-gh-webhook-timestamp')
          }
        })

        this.logger.info('GateHub webhook forwarded to wallet')
        next(e)
      } catch (e) {
        this.logger.info('GateHub webhook forwarded to wallet failed')
        next(e)
      }
  }
}
