import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { finishOrderSchema } from '@shared/boutique'

type FinishCheckoutMutationParams = z.infer<typeof finishOrderSchema>

export function useFinishCheckoutMutation(
  orderId: string,
  options?: UseMutationOptions<
    SuccessResponse,
    APIError<z.infer<typeof finishOrderSchema>>,
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
