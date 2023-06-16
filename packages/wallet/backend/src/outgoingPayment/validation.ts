import { z } from 'zod'

export const outgoingPaymentSchema = z.object({
  body: z.object({
    quoteId: z.string()
  })
})
