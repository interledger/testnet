import { useProductQuery } from '@/hooks/useProductQuery'

export function Component() {
  const x = useProductQuery()

  console.log(x.data, x.error)
}
