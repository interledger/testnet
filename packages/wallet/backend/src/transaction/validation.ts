import { z } from 'zod'

export const transactionListRequestSchema = z.object({
  query: z.object({
    orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
  })
})

const transactionExtendedObject = z
  .object({
    accountId: z.string().uuid().optional(),
    walletAddressId: z.string().uuid().optional(),
    assetCode: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional()
  })
  .strict()

export const transactionListAllRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().nonnegative().default(0),
    pageSize: z.coerce.number().int().positive().default(10),
    filter: transactionExtendedObject.optional().default({}),
    orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
  })
})
