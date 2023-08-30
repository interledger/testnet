import { z } from 'zod'

export const grantResponseSchema = z.object({
  body: z.object({
    response: z.enum(['accept', 'reject'])
  })
})
