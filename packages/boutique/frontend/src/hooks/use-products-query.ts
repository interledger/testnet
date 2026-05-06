import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { fetcher, APIError } from '@/lib/fetcher.ts'
import { SuccessResponse } from '@/lib/types.ts'

export enum ProductType {
  ONE_TIME = 'ONE_TIME',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

export enum BillingInterval {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  image: string
  imageDark: string
  productType: ProductType
  billingInterval?: BillingInterval
  billingIntervalCount?: number
}

export function useProductsQuery(): UseQueryResult<
  SuccessResponse<Product[]>,
  APIError
> {
  return useQuery({
    queryKey: ['products'],
    queryFn: async function () {
      return await fetcher<Product[]>('/products', {
        method: 'GET'
      })
    }
  })
}
