import { z } from 'zod'

export const outgoingPaymentSchema = z.object({
    incomingPaymentUrl: z.string().url(),
    paymentPointerId: z.string().uuid(),
    amount: z.number(),
})
