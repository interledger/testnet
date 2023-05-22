import { z } from 'zod'
import { EventType, PaymentType } from './service'

export const webhookSchema = z.object({
  body: z.object({
    id: z.string({ required_error: 'id is required' }),
    type: z.nativeEnum(EventType),
    data: z.record(z.string(), z.any())
  })
})

export const amountSchema = z.object({
  value: z.bigint(),
  assetCode: z.string(),
  assetScale: z.number()
})

export const quoteSchmea = z.object({
  body: z.object({
    id: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    paymentPointerId: z.string(),
    receiver: z.string(),
    sendAmount: amountSchema,
    receiveAmount: amountSchema,
    maxPacketAmount: z.bigint(),
    minExchangeRate: z.number(),
    lowEstimatedExchangeRate: z.number(),
    highEstimatedExchangeRate: z.number(),
    createdAt: z.string(),
    expiresAt: z.string()
  })
})
