import type { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '@shared/backend'
import { createHmac } from 'crypto'
import { Env } from '@/config/env'
import { Logger } from 'winston'

const TOLERANCE_MILLISECONDS = 5000

export const isGateHubSignedWebhook = (env: Env, logger: Logger) => {
  const verify = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.body.timestamp) {
        // Respond with 200 on initial setup call
        res.status(200).json()
        return
      }

      const body = JSON.stringify(req.body)
      const key = Buffer.from(env.GATEHUB_WEBHOOK_SECRET, 'hex')
      const messageBuffer = Buffer.from(body, 'utf-8')

      const requestSignature = createHmac('sha256', key)
        .update(messageBuffer)
        .digest('hex')

      const timeDiffMilliseconds =
        new Date().getTime() - parseFloat(req.body.timestamp)
      const webhookSignature = req.headers['x-gh-webhook-signature']

      // Check the difference of the received and current timestamp based on your tolerance
      const timestampIsValid = timeDiffMilliseconds < TOLERANCE_MILLISECONDS
      const signatureIsValid = requestSignature === webhookSignature

      const isSignatureValid = timestampIsValid && signatureIsValid

      if (!isSignatureValid) {
        logger.warn('GateHub invalid signature', {
          timestampIsValid,
          signatureIsValid,
          body,
          webhookSignature
        })
        throw new Unauthorized('Invalid signature header')
      }
    } catch (e) {
      next(e)
    }

    next()
  }

  return verify
}
