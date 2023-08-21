import { Product } from './model'

type GetColumns = 'id' | 'slug'

export interface IProductService {
  getById: (id: string) => Promise<Product | undefined>
  getBySlug: (slug: string) => Promise<Product | undefined>
  list: () => Promise<Product[]>
}

export class ProductService implements IProductService {
  public async getById(id: string): Promise<Product | undefined> {
    return await this.get('id', id)
  }

  public async getBySlug(slug: string): Promise<Product | undefined> {
    return await this.get('slug', slug)
  }

  public async list() {
    return await Product.query()
  }

  public async getImage(id: string) {
    return await Product.query().findById(id).select('image')
  }

  private async get(
    column: GetColumns,
    value: string
  ): Promise<Product | undefined> {
    return await Product.query().where(column, '=', value).first()
  }
}
