import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { oneClickSetupSchema } from '@shared/boutique'

interface SetupOneClickMutationParams {
  walletAddressUrl: string
  amount: number
}

interface SetupOneClickMutationResponse {
  redirectUrl: string
}
export function useSetupOneClickMutation(
  options?: UseMutationOptions<
    SuccessResponse<SetupOneClickMutationResponse>,
    APIError<z.infer<typeof oneClickSetupSchema>>,
    SetupOneClickMutationParams
  >
) {
  return useCustomMutation(
    { endpoint: '/orders/setup-one-click', method: 'POST' },
    options
  )
}
