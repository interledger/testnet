import { APIError, fetcher } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'
import {
  UseMutationOptions,
  UseMutationResult,
  useMutation
} from '@tanstack/react-query'
import { z } from 'zod'

export function useCustomMutation<
  TData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TSchema extends z.ZodObject<any>,
  TParams
>(
  endpoint: string,
  schema: TSchema,
  options?: UseMutationOptions<
    SuccessReponse<TData>,
    APIError<z.infer<typeof schema>>,
    TParams
  >
): UseMutationResult<
  SuccessReponse<TData>,
  APIError<z.infer<typeof schema>>,
  TParams
> {
  return useMutation({
    mutationFn: async function (params: TParams) {
      return await fetcher(endpoint, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(params)
      })
    },
    ...options
  })
}
