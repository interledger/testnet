import { z } from 'zod'

export const incomingPaymentSchema = z.object({
  paymentPointerId: z.string().uuid(),
  amount: z.number(),
  description: z.string().optional()
})
