import { Logger } from 'winston'
import { Product } from './model'
import { NotFound } from '@/errors'

type GetColumns = 'id' | 'slug'

export interface IProductService {
  getById: (id: string) => Promise<Product | undefined>
  getBySlug: (slug: string) => Promise<Product | undefined>
  list: () => Promise<Product[]>
}

export class ProductService implements IProductService {
  constructor(private readonly logger: Logger) {}

  public async getById(id: string): Promise<Product> {
    const product = await this.get('id', id)
    if (!product) {
      this.logger.error(`Product with ID "${id}" was not found.`)
      throw new NotFound('Product was not found.')
    }
    return product
  }

  public async getBySlug(slug: string): Promise<Product> {
    const product = await this.get('slug', slug)
    if (!product) {
      this.logger.error(`Product with slug "${slug}" was not found.`)
      throw new NotFound('Product was not found.')
    }
    return product
  }

  public async list() {
    return await Product.query().orderBy('createdAt', 'DESC')
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
