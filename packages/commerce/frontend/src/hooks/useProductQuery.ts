import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { fetcher, APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'
import { Product } from './useProductsQuery'
import { useZodRouteParams } from './useZodParams'
import { productSlugParamsSchema } from '@/app/route-schemas'

export function useProductQuery(): UseQueryResult<
  SuccessReponse<Product>,
  APIError
> {
  const { slug } = useZodRouteParams(productSlugParamsSchema)
  return useQuery({
    queryKey: ['products', slug],
    queryFn: async function () {
      return await fetcher<Product>('/products/' + slug, {
        method: 'GET',
        credentials: 'include'
      })
    }
  })
}
