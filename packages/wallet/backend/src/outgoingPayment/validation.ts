import { z } from 'zod'

export const outgoingPaymentSchema = z.object({
  body: z.object({
    quoteId: z.string().uuid(),
    paymentIntentId: z.string().min(1),
    description: z.string().optional()
  })
})
