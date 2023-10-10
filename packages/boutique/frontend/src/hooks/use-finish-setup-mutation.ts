import { APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { oneClickConfirmationSearchParamsSchema } from '@/app/route-schemas.ts'

type FinishSetupMutationParams = z.infer<typeof finishSetupSchema>

export const finishSetupSchema = oneClickConfirmationSearchParamsSchema

export function useFinishSetupMutation(
  options?: UseMutationOptions<
    SuccessReponse<{ accessToken: string }>,
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
