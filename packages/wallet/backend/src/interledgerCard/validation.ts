import { z } from 'zod'

export const cardSchema = z.object({
  body: z.object({
    walletAddressId: z.string(),
    accountId: z.string().uuid()
  })
})

export const cardIdSchema = z.object({
  params: z.object({
    cardId: z.string().uuid()
  })
})
