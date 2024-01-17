import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'

type FinishCheckoutMutationParams = z.infer<typeof finishCheckoutSchema>

export const finishCheckoutSchema = z.object({
  result: z.enum(['grant_rejected', 'grant_invalid']).optional(),
  hash: z.string().optional(),
  interactRef: z.string().uuid().optional()
})

export function useFinishCheckoutMutation(
  orderId: string,
  options?: UseMutationOptions<
    SuccessResponse,
    APIError<z.infer<typeof finishCheckoutSchema>>,
    FinishCheckoutMutationParams
  >
) {
  return useCustomMutation(
    {
      endpoint: '/orders/' + orderId,
      method: 'PATCH'
    },
    options
  )
}
