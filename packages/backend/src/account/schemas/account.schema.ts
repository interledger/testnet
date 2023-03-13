import { z } from 'zod'

export const accountSchema = z.object({
  name: z.string(),
  assetRafikiId: z.string().uuid()
})
