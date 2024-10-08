import type { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '@shared/backend'
import { env } from '@/config/env'
import { createHmac } from 'crypto'
import { canonicalize } from 'json-canonicalize'

const TOLERANCE_SECONDS = 5
const pattern = /t=(\d+),\s*v1=([a-f0-9]+)/
export const isRafikiSignedWebhook = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers['rafiki-signature']
    if (typeof header !== 'string') {
      throw new Unauthorized('Invalid signature header')
    }
    const match = header.match(pattern)
    if (!match) {
      throw new Unauthorized('Invalid signature header')
    }

    const timestamp = match[1]
    const digest = match[2]

    if (!timestamp || !digest) {
      throw new Unauthorized('Invalid signature header')
    }

    const timeDiffSeconds =
      Math.round(new Date().getTime() / 1000) - Number(timestamp)

    if (timeDiffSeconds > TOLERANCE_SECONDS) {
      throw new Unauthorized('Invalid signature header')
    }

    const payload = `${timestamp}.${canonicalize(req.body)}`

    const requestSignature = createHmac(
      'sha256',
      env.RAFIKI_WEBHOOK_SIGNATURE_SECRET
    )
      .update(payload)
      .digest('hex')

    if (requestSignature !== digest) {
      throw new Unauthorized('Invalid signature header')
    }
  } catch (e) {
    next(e)
  }

  next()
}
