import { Logger } from 'winston'
import { Product } from './model'
import { NotFound } from '@shared/backend'

type GetColumns = 'id' | 'slug'

export interface IProductService {
  getById: (id: string) => Promise<Product | undefined>
  getBySlug: (slug: string) => Promise<Product | undefined>
  list: () => Promise<Product[]>
}

export class ProductService implements IProductService {
  private logger: Logger
  constructor(logger: Logger) {
    this.logger = logger.child({ service: this.constructor.name })
  }

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
    return await Product.query().orderBy('createdAt', 'ASC')
  }

  private async get(
    column: GetColumns,
    value: string
  ): Promise<Product | undefined> {
    return await Product.query().where(column, '=', value).first()
  }
}
