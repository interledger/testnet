import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { z } from 'zod'

export function useZodRouteParams<Z extends z.AnyZodObject>(
  schema: Z
): z.infer<Z> {
  const params = useParams()
  return useMemo(() => schema.parse(params), [params, schema])
}
