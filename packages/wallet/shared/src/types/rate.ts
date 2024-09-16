import { z } from 'zod'

export interface RatesResponse {
  base: string
  rates: Record<string, number>
}

export const ratesSchema = z.object({
  query: z.object({
    base: z
      .string()
      .length(3)
      .transform((v) => v.toLocaleUpperCase())
  })
})
