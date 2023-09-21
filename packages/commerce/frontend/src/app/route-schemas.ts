import { z } from 'zod'

export const productSlugParamsSchema = z.object({ slug: z.string() })
export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>

export const checkoutConfirmationSearchParamsSchema = z.object({
  result: z.enum(['grant_rejected', 'grant_invalid']).optional(),
  hash: z.string().optional(),
  interact_ref: z.string().uuid().optional(),
  orderId: z.string().uuid()
})
