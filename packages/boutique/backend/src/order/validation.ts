import { z } from 'zod'

export const createOrderSchema = z.object({
  walletAddressUrl: z
    .string()
    .transform((val) => val.replace('$', 'https://'))
    .pipe(z.string().url({ message: 'Invalid payment pointer.' })),
  products: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int()
      })
    )
    .nonempty()
})

export const finishOrderSchema = z.object({
  result: z.enum(['grant_rejected', 'grant_invalid']).optional(),
  hash: z.string().optional(),
  interactRef: z.string().uuid().optional()
})

export const setupFinishSchema = finishOrderSchema.extend({
  identifier: z.string().uuid()
})

export const oneClickSetupSchema = z.object({
  walletAddress: z.string(),
  amount: z.number()
})
