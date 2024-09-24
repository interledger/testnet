import { z } from 'zod'

export const accountSchema = z.object({
  body: z.object({
    name: z.string(),
    assetId: z.string().uuid()
  })
})

export const createExchangeQuoteSchema = z.object({
  body: z.object({
    assetCode: z.string(),
    amount: z.number().positive()
  })
})
