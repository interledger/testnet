import { APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'
import { type OrderItem } from '@/hooks/use-create-order-mutation.ts'

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

export const instantBuySchema = z.object({
  walletAddressUrl: z.string(),
  accessToken: z.string(),
  manageUrl: z.string(),
  products: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int()
    })
  )
})

export function useInstantBuyMutation(
  options?: UseMutationOptions<
    SuccessReponse<InstantBuyMutationResponse>,
    APIError<z.infer<typeof instantBuySchema>>,
    InstantBuyMutationParams
  >
) {
  return useCustomMutation(
    { endpoint: '/orders/instant-buy', method: 'POST' },
    options
  )
}
