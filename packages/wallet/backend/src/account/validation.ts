import { z } from 'zod'

export const accountSchema = z.object({
  body: z.object({
    name: z.string(),
    assetId: z.string().uuid()
  })
})

export const fundSchema = z.object({
  body: z.object({
    amount: z.coerce
      .number({
        invalid_type_error: 'Amount is not valid',
        required_error: 'Amount is required'
      })
      .positive(),
    assetCode: z.string()
  })
})
