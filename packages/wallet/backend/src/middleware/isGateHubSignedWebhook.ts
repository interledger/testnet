import type { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '@shared/backend'
import { env } from '@/config/env'
import { createHmac } from 'crypto'

const TOLERANCE_MILLISECONDS = 5000
export const isGateHubSignedWebhook = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = JSON.stringify(req.body)
    const key = Buffer.from(env.GATEHUB_WEBHOOK_SECRET, 'hex')
    const messageBuffer = Buffer.from(body, 'utf-8')

    const requestSignature = createHmac('sha256', key)
      .update(messageBuffer)
      .digest('hex')

    const timeDiffMilliseconds =
      new Date().getTime() - parseFloat(req.body.timestamp)

    // Check the difference of the received and current timestamp based on your tolerance
    const timestampIsValid = timeDiffMilliseconds < TOLERANCE_MILLISECONDS
    const signatureIsValid = requestSignature === req.header.signature

    const isSignatureValid = timestampIsValid && signatureIsValid

    if (!isSignatureValid) {
      throw new Unauthorized('Invalid signature header')
    }
  } catch (e) {
    next(e)
  }

  next()
}
