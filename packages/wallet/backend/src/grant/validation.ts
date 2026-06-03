import { SortOrder } from '@/rafiki/backend/generated/graphql'
import { z } from 'zod'

export const grantResponseSchema = z.object({
  body: z.object({
    response: z.enum(['accept', 'reject'])
  })
})

export const grantListRequestSchema = z.object({
  body: z.object({
    page: z.coerce.number().int().nonnegative().default(0),
    pageSize: z.coerce.number().int().positive().default(10),
    sortOrder: z
      .enum(['ASC', 'DESC'])
      .transform((val) => val as SortOrder)
      .default(SortOrder.Desc)
  })
})
