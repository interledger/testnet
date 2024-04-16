import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { type OrderItem } from '@/hooks/use-create-order-mutation.ts'
import { instantBuySchema } from '@shared/boutique'

interface InstantBuyMutationParams {
  accessToken: string
  manageUrl: string
  walletAddressUrl: string
  products: OrderItem[]
}

interface InstantBuyMutationResponse {
  accessToken: string
  manageUrl: string
  walletAddressUrl: string
}
export function useInstantBuyMutation(
  options?: UseMutationOptions<
    SuccessResponse<InstantBuyMutationResponse>,
    APIError<z.infer<typeof instantBuySchema>>,
    InstantBuyMutationParams
  >
) {
  return useCustomMutation(
    { endpoint: '/orders/instant-buy', method: 'POST' },
    options
  )
}
