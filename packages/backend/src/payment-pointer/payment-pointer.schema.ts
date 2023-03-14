import { z } from 'zod'

export const paymentPointerSchema = z.object({
  paymentPointerName: z
    .string()
    .min(3, {
      message: "Payment pointer's name should be at least 3 characters long"
    }),
  publicName: z
    .string()
    .min(3, {
      message:
        "Payment pointer's public name should be at least 3 characters long"
    })
})
