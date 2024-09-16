import { z } from 'zod'

export const ratesSchema = z.object({
  query: z.object({
    base: z
      .string()
      .length(3)
      .transform((v) => v.toLocaleUpperCase())
  })
})
