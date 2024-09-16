import { z } from 'zod'
import { EventType, PaymentType } from './service'

export const webhookSchema = z.object({
  body: z.object({
    id: z.string({ required_error: 'id is required' }),
    type: z.nativeEnum(EventType),
    data: z.record(z.string(), z.any())
  })
})

const quoteAmountSchema = z.object({
  value: z.coerce.bigint(),
  assetCode: z.string(),
  assetScale: z.number()
})

export const quoteSchema = z.object({
  body: z.object({
    id: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    walletAddressId: z.string(),
    receiver: z.string(),
    debitAmount: quoteAmountSchema,
    receiveAmount: quoteAmountSchema,
    maxPacketAmount: z.bigint().optional(),
    minExchangeRate: z.number().optional(),
    lowEstimatedExchangeRate: z.number().optional(),
    highEstimatedExchangeRate: z.number().optional(),
    createdAt: z.string(),
    expiresAt: z.string()
  })
})
