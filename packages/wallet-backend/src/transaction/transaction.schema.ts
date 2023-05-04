import { z } from 'zod'

export const transactionListRequestSchema = z.object({
  orderByDate: z.enum(['ASC', 'DESC']).default('DESC')
})
