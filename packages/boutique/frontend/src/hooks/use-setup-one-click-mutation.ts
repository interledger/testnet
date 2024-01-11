import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'

interface SetupOneClickMutationParams {
  walletAddressUrl: string
  amount: number
}

interface SetupOneClickMutationResponse {
  redirectUrl: string
}

export const oneClickBuySetupSchema = z.object({
  walletAddressUrl: z.string(),
  amount: z.coerce.number()
})

export function useSetupOneClickMutation(
  options?: UseMutationOptions<
    SuccessResponse<SetupOneClickMutationResponse>,
    APIError<z.infer<typeof oneClickBuySetupSchema>>,
    SetupOneClickMutationParams
  >
) {
  return useCustomMutation(
    { endpoint: '/orders/setup-one-click', method: 'POST' },
    options
  )
}
