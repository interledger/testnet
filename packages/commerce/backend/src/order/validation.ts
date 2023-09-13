import { z } from 'zod'

export const createOrderSchema = z.object({
  paymentPointerUrl: z
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
  result: z.enum(['grant_reject', 'grant_invalid']).optional(),
  hash: z.string().optional(),
  interactRef: z.string().uuid().optional()
})
