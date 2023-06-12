import { z } from 'zod'

export const assetSchema = z.object({
  body: z.object({
    code: z.string(),
    scale: z.number()
  })
})
