import { z } from 'zod'

export const generateWalletAddressKey = z.object({
  body: z.object({
    nickname: z
      .string()
      .trim()
      .min(3, { message: 'Name must be at least 3 characters long' })
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
    nickname: z
      .string()
      .trim()
      .min(3, { message: 'Name must be at least 3 characters long' }),
    base64Key: z.string()
  })
})

export const batchRevokeWalletAddressKeys = z.object({
  body: z.object({
    keys: z
      .array(
        z.object({
          keyId: z.string().uuid(),
          accountId: z.string().uuid(),
          walletAddressId: z.string().uuid()
        })
      )
      .nonempty()
  })
})
