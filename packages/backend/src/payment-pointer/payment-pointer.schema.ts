import { z } from 'zod'

export const paymentPointerSchema = z.object({
  publicName: z.string()
})
