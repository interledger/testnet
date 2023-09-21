import { Product } from '@/product/model'
import { type PartialModelObject } from 'objection'

export async function createProducts(args: PartialModelObject<Product>[]) {
  await Product.query().insert(args)
}
