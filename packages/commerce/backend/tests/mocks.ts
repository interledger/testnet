import { Product } from '@/product/model'
import { randomUUID } from 'crypto'

export const mockProduct = (overrides?: Partial<Product>) => ({
  id: randomUUID(),
  name: `Product ${randomUUID()}`,
  description: 'Product description',
  image: 'Image',
  price: 10.0,
  ...overrides
})
