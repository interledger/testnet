import { z } from 'zod'

export const outgoingPaymentSchema = z.object({
  incomingPaymentUrl: z.string().url().optional(),
  toPaymentPointerId: z.string().uuid().optional(),
  paymentPointerId: z.string().uuid(),
  amount: z.number(),
  isReceive: z.boolean().default(true)
})
