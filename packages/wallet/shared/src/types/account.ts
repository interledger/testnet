import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Accout name should be at least 3 characters long' }),
  asset: z.object({
    value: z
      .string({ required_error: 'Please select an asset for your account' })
      .uuid(),
    label: z.string().min(1)
  })
})

export const exchangeAssetSchema = z.object({
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive({ message: 'Please enter an amount' }),
  asset: z.object({
    value: z
      .string({
        required_error: 'Please select an asset you want to exchange to'
      })
      .uuid(),
    label: z.string().min(1)
  })
})
