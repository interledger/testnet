import { type NextRouter, useRouter } from 'next/router'
import { z } from 'zod'

export function useTypedRouter<T extends z.ZodSchema>(
  schema: T
): NextRouter & { query: z.infer<T> } {
  const { query, ...router } = useRouter()

  return {
    query: schema.parse(query) as z.infer<typeof schema>,
    ...router
  }
}
