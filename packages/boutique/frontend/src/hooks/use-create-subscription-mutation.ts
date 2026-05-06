import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { createSubscriptionSchema } from '@boutique/shared'

interface CreateSubscriptionMutationResponse {
  redirectUrl: string
}

type CreateSubscriptionMutationParams = z.infer<typeof createSubscriptionSchema>

export function useCreateSubscriptionMutation(
  options?: UseMutationOptions<
    SuccessResponse<CreateSubscriptionMutationResponse>,
    APIError<z.infer<typeof createSubscriptionSchema>>,
    CreateSubscriptionMutationParams
  >
) {
  return useCustomMutation(
    {
      endpoint: '/subscriptions',
      method: 'POST'
    },
    options
  )
}
