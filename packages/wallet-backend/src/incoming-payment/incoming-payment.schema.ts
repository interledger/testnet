import { z } from 'zod'

export const incomingPaymentSchema = z.object({
  paymentPointerId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional()
})
export const paymentDetailsSchema = z.object({
  url: z
    .string()
    .url()
    .regex(
      new RegExp(
        /\/[a-z1-9_]*\/incoming-payments\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      ),
      {
        message: 'Url is not a valid incoming payment url'
      }
    )
})
