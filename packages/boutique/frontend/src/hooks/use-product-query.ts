import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { fetcher, APIError } from '@/lib/fetcher.ts'
import { SuccessReponse } from '@/lib/types.ts'
import { Product } from './use-products-query.ts'
import { useZodRouteParams } from './use-zod-params.ts'
import { productSlugParamsSchema } from '@/app/route-schemas.ts'

export function useProductQuery(): UseQueryResult<
  SuccessReponse<Product>,
  APIError
> {
  const { slug } = useZodRouteParams(productSlugParamsSchema)
  return useQuery({
    queryKey: ['products', slug],
    queryFn: async function () {
      return await fetcher('/products/' + slug, {
        method: 'GET'
      })
    }
  })
}
