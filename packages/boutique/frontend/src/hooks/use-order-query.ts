import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { fetcher, APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'

export enum OrderStatus {
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface Order {
  id: string
  status: OrderStatus
}
export function useOrderQuery(
  id: string
): UseQueryResult<SuccessResponse<Order>, APIError> {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async function () {
      return await fetcher('/orders/' + id, {
        method: 'GET'
      })
    },
    refetchInterval: (query) => {
      return !query.state.data ||
        query.state.data.result?.status === OrderStatus.PROCESSING
        ? 2000
        : undefined
    }
  })
}
