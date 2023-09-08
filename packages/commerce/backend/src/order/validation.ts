import { z } from 'zod'

export const createOrderSchema = z.object({
  products: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int()
      })
    )
    .nonempty()
})
