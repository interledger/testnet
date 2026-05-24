import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { StripeService } from './service'
import { validate } from '../shared/validate'
import { webhookBodySchema } from './validation'
import { BadRequest } from '@shared/backend'
import { env } from '../config/env'
import express from 'express'
import Stripe from 'stripe'

interface IStripeController {
  onWebHook: (req: Request, res: Response, next: NextFunction) => Promise<void>
}

export class StripeController implements IStripeController {
  public webhookMiddleware: express.RequestHandler = express.raw({
    type: 'application/json'
  })
  private stripe: Stripe

  constructor(
    private logger: Logger,
    private stripeService: StripeService
  ) {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY)
  }

  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['stripe-signature']

      if (!signature) {
        throw new BadRequest('Missing stripe-signature header')
      }

      try {
        this.stripe.webhooks.constructEvent(
          req.body,
          signature,
          env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err) {
        this.logger.error('Webhook signature verification failed', {
          error: err
        })
        throw new BadRequest('Invalid stripe webhook signature')
      }
      this.logger.info('\n--------------------------------\n')
      this.logger.info('Stripe webhook received \n')
      this.logger.info('Request \n')
      this.logger.info(req)
      this.logger.info('Request body \n')
      this.logger.info(req.body)
      this.logger.info('\n--------------------------------\n')

      const parsedBody = JSON.parse(req.body.toString())
      req.body = parsedBody

      const wh = await validate(webhookBodySchema, req)
      await this.stripeService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      this.logger.error(
        `Webhook response error for stripe: ${(e as Error).message}`,
        req.body
      )
      next(e)
    }
  }
}
