import { useRouter } from 'next/router'
import { ZodSchema, z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTypedRouter: any = <T extends ZodSchema>(schema: T) => {
  const { query, ...router } = useRouter()

  return {
    query: schema.parse(query) as z.infer<typeof schema>,
    ...router
  }
}
