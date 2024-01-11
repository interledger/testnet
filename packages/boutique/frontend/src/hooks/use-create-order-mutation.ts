import { APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'

export interface OrderItem {
  productId: string
  quantity: number
}

interface CreateOrderMutationParams {
  walletAddressUrl: string
  products: OrderItem[]
}

interface CreateOrderMutationResponse {
  redirectUrl: string
}

export const createOrderSchema = z.object({
  walletAddressUrl: z.string()
})

export function useCreateOrderMutation(
  options?: UseMutationOptions<
    SuccessResponse<CreateOrderMutationResponse>,
    APIError<z.infer<typeof createOrderSchema>>,
    CreateOrderMutationParams
  >
) {
  return useCustomMutation({ endpoint: '/orders' }, options)
}
