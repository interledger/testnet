import { z } from 'zod'

export const fundSchema = z.object({
  amount: z.coerce
    .number({
      invalid_type_error: 'Amount is not valid',
      required_error: 'Amount is required'
    })
    .positive(),
  assetCode: z.string()
})
