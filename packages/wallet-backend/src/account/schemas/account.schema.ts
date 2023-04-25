import { z } from 'zod'

export const accountSchema = z.object({
  name: z.string(),
  assetRafikiId: z.string().uuid()
})

export const accountFundsSchema = z.object({
  amount: z.coerce
    .number({
      invalid_type_error: 'Amount is not valid',
      required_error: 'Amount is required'
    })
    .positive(),
  assetCode: z.string()
})
