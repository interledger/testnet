import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { finishSubscriptionSchema } from '@boutique/shared'

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED'
}

export interface FinishSubscriptionResponse {
  status: SubscriptionStatus
  nextBillingAt?: string
}

type FinishSubscriptionMutationParams = z.infer<typeof finishSubscriptionSchema>

export function useFinishSubscriptionMutation(
  subscriptionId: string,
  options?: UseMutationOptions<
    SuccessResponse<FinishSubscriptionResponse>,
    APIError<z.infer<typeof finishSubscriptionSchema>>,
    FinishSubscriptionMutationParams
  >
) {
  return useCustomMutation(
    {
      endpoint: '/subscriptions/' + subscriptionId,
      method: 'PATCH'
    },
    options
  )
}
