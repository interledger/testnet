import { NotFound } from '@/errors'
import { Order } from '@/order/model'
import { Product } from '@/product/model'
import { BaseModel } from '@/shared/model'
import { Model, QueryContext } from 'objection'

export class OrderItem extends BaseModel {
  static tableName = 'orderItems'

  public id!: string
  public orderId!: string
  public productId!: string
  public quantity!: number
  public price!: number

  public async $beforeInsert(ctx: QueryContext): Promise<void> {
    super.$beforeInsert(ctx)
    const product = await Product.query(ctx.transaction)
      .findById(this.productId)
      .select('price')
    if (!product) throw new NotFound('Product not found')
    this.price = product.price
  }

  public $afterInsert(_queryContext: QueryContext): void {
    console.log('after insert order item')
  }

  static relationMappings = () => ({
    order: {
      relation: Model.BelongsToOneRelation,
      modelClass: Order,
      join: {
        from: 'orderItems.orderId',
        to: 'orders.id'
      }
    },

    product: {
      relation: Model.BelongsToOneRelation,
      modelClass: Product,
      join: {
        from: 'orderItems.productId',
        to: 'products.id'
      }
    }
  })
}
