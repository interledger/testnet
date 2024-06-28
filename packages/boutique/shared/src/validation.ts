import { z } from 'zod'

export const walletAddressUrlSchema = z
  .string()
  .transform((val) => val.replace('$', 'https://'))
  .pipe(z.string().url({ message: 'Invalid wallet address.' }))

export const createOrderSchema = z.object({
  walletAddressUrl: walletAddressUrlSchema,
  products: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int()
      })
    )
    .nonempty()
})

export const instantBuySchema = createOrderSchema.extend({
  accessToken: z.string(),
  manageUrl: z.string().url()
})

export const finishOrderSchema = z.object({
  result: z.enum(['grant_rejected', 'grant_invalid']).optional(),
  hash: z.string().optional(),
  interactRef: z.string().uuid().optional()
})

export const setupFinishSchema = finishOrderSchema.extend({
  identifier: z.string().uuid()
})

export const oneClickSetupSchema = z.object({
  walletAddressUrl: walletAddressUrlSchema,
  amount: z
    .union([z.string(), z.number()])
    .refine((value) => !isNaN(Number(value)), {
      message: 'Must be a valid number'
    })
})
