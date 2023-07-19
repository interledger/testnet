import { z } from 'zod'

export const transactionListRequestSchema = z.object({
  query: z.object({
    orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
  })
})

const transactionExtendedObject = z
  .object({
    // id: z.string().optional(),
    // paymentId: z.string().optional(),
    // description: z.string().optional(),
    accountId: z.string().uuid().optional(),
    // value: z.coerce.bigint().optional(),
    paymentPointerId: z.string().uuid().optional(),
    assetCode: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional()

    // paymentPointerUrl: z.string().optional(),
    // accountName: z.string().optional()
  })
  .strict()

export const transactionListAllRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().nonnegative().default(0),
    pageSize: z.coerce.number().int().positive().default(10),
    filter: transactionExtendedObject.optional(),
    orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
  })
})
