import { z } from 'zod'

export const transactionListRequestSchema = z.object({
  query: z.object({
    orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
  })
})

const transactionObject = z.object({
  id: z.string().optional(),
  paymentId: z.string().optional(),
  description: z.string().optional(),
  paymentPointerId: z.string().optional(),
  accountId: z.string().optional(),
  assetCode: z.string().optional(),
  value: z.bigint().optional(),
  type: z.string().optional(),
  status: z.string().optional()
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
      .default('Infinity'),
    filter: transactionObject.optional()
  })
})
