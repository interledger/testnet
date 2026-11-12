import { z } from 'zod'

export const grantResponseSchema = z.object({
  body: z.object({
    response: z.enum(['accept', 'reject'])
  })
})

export const grantListRequestSchema = z.object({
  body: z.object({
    walletAddressId: z.string().uuid(),
    state: z
      .enum([
        'PROCESSING',
        'PENDING',
        'APPROVED',
        'ISSUED',
        'REJECTED',
        'REVOKED'
      ])
      .optional(),
    cursor: z.string().min(1).optional(),
    direction: z.enum(['next', 'previous']).default('next'),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
  })
})

export type ListUserGrantsArgs = z.infer<typeof grantListRequestSchema>['body']
