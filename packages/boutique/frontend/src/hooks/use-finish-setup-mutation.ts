import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { finishCheckoutSchema } from '@/hooks/use-finish-checkout-mutation.ts'
import { TokenState } from '@/lib/stores/token-store.ts'

type FinishSetupMutationParams = z.infer<typeof finishSetupSchema>

export const finishSetupSchema = finishCheckoutSchema.extend({
  identifier: z.string().uuid()
})

export function useFinishSetupMutation(
  options?: UseMutationOptions<
    SuccessResponse<TokenState>,
    APIError<z.infer<typeof finishSetupSchema>>,
    FinishSetupMutationParams
  >
) {
  return useCustomMutation(
    {
      endpoint: '/orders/setup-one-click/finish',
      method: 'POST'
    },
    options
  )
}
