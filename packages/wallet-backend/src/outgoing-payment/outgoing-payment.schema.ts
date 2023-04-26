import { z } from 'zod'

export const outgoingPaymentSchema = z.object({
  incomingPaymentUrl: z.string().url().optional(),
  toPaymentPointerUrl: z.string().url().optional(),
  paymentPointerId: z.string().uuid(),
  amount: z.number().positive(),
  isReceive: z.boolean().default(true),
  description: z.string().optional()
})
