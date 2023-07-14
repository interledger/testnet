import { z } from 'zod'

export const transactionListRequestSchema = z.object({
  query: z.object({
    orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
  })
})

export const transactionListAllRequestSchema = z.object({
  query: z.object({
    page: z
      .string() // Unfortunately, query params are always received as 'string'
      .refine((val: string) => Number(val) >= 0)
      .default('0'),
    pageSize: z
      .string()
      .refine((val: string) => Number(val) >= 1)
      .default('Infinity')
  })
})
