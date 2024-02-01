import { useRouter } from 'next/router'
import { ZodSchema, z } from 'zod'

export const useTypedRouter: any = <T extends ZodSchema>(schema: T) => {
  const { query, ...router } = useRouter()

  return {
    query: schema.parse(query) as z.infer<typeof schema>,
    ...router
  }
}
