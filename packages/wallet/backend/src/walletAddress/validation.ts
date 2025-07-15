import { z } from 'zod'

export const externalWalletAddressSchema = z.object({
  query: z.object({
    url: z
      .string()
      .transform((val) => val.replace('$', 'https://'))
      .pipe(z.string().url())
  })
})

export const walletAddressSchema = z.object({
  body: z.object({
    walletAddressName: z
      .string()
      .trim()
      .regex(new RegExp(/^[a-z1-9_-]*$/), {
        message:
          'Wallet address name can only contain letters, numbers (non zero), hyphens and underscores'
      })
      .min(3, {
        message: 'Wallet address name must be at least 3 characters long'
      })
      .refine((walletAddressName) => walletAddressName[0] !== '_', {
        message: 'Wallet address name cannot start with an underscore'
      })
      .refine(
        (walletAddressName) =>
          walletAddressName[walletAddressName.length - 1] !== '_',
        {
          message: 'Wallet address name cannot end with an underscore'
        }
      )
      .refine((walletAddressName) => walletAddressName[0] !== '-', {
        message: 'Wallet address name cannot start with a hyphen'
      })
      .refine(
        (walletAddressName) =>
          walletAddressName[walletAddressName.length - 1] !== '-',
        {
          message: 'Wallet address name cannot end with a hyphen'
        }
      ),
    publicName: z
      .string()
      .trim()
      .min(3, { message: 'Public name must be at least 3 characters long' })
  })
})

export const updateWalletAddressSchema = z.object({
  body: z.object({
    publicName: z
      .string()
      .trim()
      .min(3, { message: 'Public name must be at least 3 characters long' })
  })
})
