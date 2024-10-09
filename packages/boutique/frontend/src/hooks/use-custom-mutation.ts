import { APIError, fetcher } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import {
  UseMutationOptions,
  UseMutationResult,
  useMutation
} from '@tanstack/react-query'
import { z } from 'zod'

interface FetcherOptions {
  endpoint: string
  method?: string
}

export function useCustomMutation<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TSchema extends z.ZodObject<any>['_output'],
  TData,
  TParams
>(
  fetcherOptions: FetcherOptions,
  options?: UseMutationOptions<
    SuccessResponse<TData>,
    APIError<TSchema>,
    TParams
  >
): UseMutationResult<SuccessResponse<TData>, APIError<TSchema>, TParams> {
  const { method, endpoint } = fetcherOptions
  return useMutation({
    mutationFn: async function (params: TParams) {
      return await fetcher(endpoint, {
        method: method ?? 'POST',
        redirect: 'follow',
        body: JSON.stringify(params)
      })
    },
    ...options
  })
}
