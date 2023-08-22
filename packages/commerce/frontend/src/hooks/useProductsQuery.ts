import { getProducts } from '@/lib/api/product.ts'
import { APIError } from '@/lib/api/error.ts'
import { useQuery } from '@tanstack/react-query'

export function useProductsQuery() {
  return useQuery<Awaited<ReturnType<typeof getProducts>>, APIError>({
    queryKey: ['products'],
    queryFn: getProducts
  })
}
