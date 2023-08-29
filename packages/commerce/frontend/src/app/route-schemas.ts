import { z } from 'zod'

export const productSlugParamsSchema = z.object({ slug: z.string() })
export type ProductSlugParams = z.infer<typeof productSlugParamsSchema>
