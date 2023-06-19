import { z } from 'zod'

export const quoteSchema = z.object({
  body: z.object({
    receiver: z.string().url(),
    paymentPointerId: z.string().uuid(),
    amount: z.number().positive(),
    isReceive: z.boolean().default(true),
    description: z.string().optional()
  })
})
