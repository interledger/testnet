import { Product } from '@/product/model'
import { randomUUID } from 'crypto'

export const mockProduct = (overrides?: Partial<Product>) => ({
  id: randomUUID(),
  name: `Product ${randomUUID()}`,
  slug: `product-${randomUUID()}`,
  description: 'Product description',
  image: 'Image',
  imageDark: 'ImageDark',
  price: 10.0,
  ...overrides
})
