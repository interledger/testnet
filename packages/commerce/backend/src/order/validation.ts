import { env } from '@/config/env'
import { z } from 'zod'

export const createOrderSchema = z.object({
  paymentPointerUrl: z
    .string()
    .transform((val) =>
      val.replace('$', env.NODE_ENV === 'development' ? 'http://' : 'https://')
    )
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
