import { z } from 'zod'

export const generateWalletAddressKey = z.object({
  body: z.object({
    nickname: z.optional(
      z
        .string()
        .trim()
        .min(3, { message: 'Name must be at least 3 characters long' })
    )
  })
})
export const patchWalletAddressKey = z.object({
  body: z.object({
    nickname: z
      .string()
      .trim()
      .min(3, { message: 'Name must be at least 3 characters long' })
  })
})

export const uploadWalletAddressKey = z.object({
  body: z.object({
    nickname: z.optional(
      z
        .string()
        .trim()
        .min(3, { message: 'Name must be at least 3 characters long' })
    ),
    base64Key: z.string()
  })
})
