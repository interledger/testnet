import { z } from 'zod'

export const outgoingPaymentSchema = z.object({
  body: z.object({
    receiver: z.string().url(),
    paymentPointerId: z.string().uuid(),
    amount: z.number().positive(),
    isReceive: z.boolean().default(true),
    description: z.string().optional()
  })
})

export const acceptQuoteSchema = z.object({
  body: z.object({
    quoteId: z.string()
  })
})
