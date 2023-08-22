import { fetcher } from '@/lib/utils.ts'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}

export async function getProducts() {
  return await fetcher<Product[]>('/', {
    method: 'GET',
    credentials: 'include'
  })
}
