import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { fetcher, APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'

export interface Product {
  id: string
  slug: string
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
      return await fetcher<Product[]>('/products', {
        method: 'GET',
        credentials: 'include'
      })
    }
  })
}
