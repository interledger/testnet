import { z } from 'zod'

export const getCardsByCustomerSchema = z.object({
  params: z.object({
    customerId: z.string()
  })
})

export const getCardDetailsSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  body: z.object({
    publicKeyBase64: z.string()
  })
})

export const getCardTransactionsSchema = z.object({
  params: z.object({
    cardId: z.string()
  }),
  query: z.object({
    pageSize: z.coerce.number().int().positive().optional(),
    pageNumber: z.coerce.number().int().nonnegative().optional()
  })
})
