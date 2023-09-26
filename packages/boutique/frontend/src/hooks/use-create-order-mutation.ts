import { APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'
import { UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { useCustomMutation } from './use-custom-mutation.ts'

interface OrderItem {
  productId: string
  quantity: number
}

interface CreateOrderMutationParams {
  paymentPointerUrl: string
  products: OrderItem[]
}

interface CreateOrderMutationResponse {
  redirectUrl: string
}

export const createOrderSchema = z.object({
  paymentPointerUrl: z.string()
})

export function useCreateOrderMutation(
  options?: UseMutationOptions<
    SuccessReponse<CreateOrderMutationResponse>,
    APIError<z.infer<typeof createOrderSchema>>,
    CreateOrderMutationParams
  >
) {
  return useCustomMutation({ endpoint: '/orders' }, options)
}
