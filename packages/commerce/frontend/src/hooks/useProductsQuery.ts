import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { fetcher, APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}

export function useProductsQuery(): UseQueryResult<
  SuccessReponse<Product[]>,
  APIError
> {
  return useQuery({
    queryKey: ['products'],
    queryFn: async function () {
      return await fetcher<Product[]>('/', {
        method: 'GET',
        credentials: 'include'
      })
    }
  })
}
