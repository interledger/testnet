import { z } from 'zod'
import { EventType, PaymentType } from './service'

export const ratesSchema = z.object({
  query: z.object({
    base: z
      .string()
      .length(3)
      .transform((v) => v.toLocaleUpperCase())
  })
})

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

const quoteAmountSchema = z.object({
  value: z.coerce.bigint(),
  assetCode: z.string(),
  assetScale: z.number()
})

export const quoteSchmea = z.object({
  body: z.object({
    id: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    paymentPointerId: z.string(),
    receiver: z.string(),
    sendAmount: quoteAmountSchema,
    receiveAmount: quoteAmountSchema,
    maxPacketAmount: z.bigint().optional(),
    minExchangeRate: z.number().optional(),
    lowEstimatedExchangeRate: z.number().optional(),
    highEstimatedExchangeRate: z.number().optional(),
    createdAt: z.string(),
    expiresAt: z.string()
  })
})
