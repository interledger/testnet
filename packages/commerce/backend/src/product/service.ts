import { Product } from './model'

export interface IProductService {
  get: (id: string) => Promise<Product | undefined>
  list: () => Promise<Product[]>
}

export class ProductService implements IProductService {
  public async get(id: string) {
    return await Product.query().findById(id)
  }

  public async list() {
    return await Product.query()
  }

  public async getImage(id: string) {
    return await Product.query().findById(id).select('image')
  }
}
