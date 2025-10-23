import { z } from 'zod'

export const quoteSchema = z.object({
  body: z.object({
    receiver: z.string().transform((val) => val.replace('$', 'https://')),
    walletAddressId: z.string().uuid(),
    amount: z.number().positive(),
    isReceive: z.boolean().default(true),
    description: z.string().optional(),
    vopNonce: z.string().optional()
  })
})
