import { Order } from '@/order/model'
import { Product } from '@/product/model'
import { BaseModel } from '@/shared/model'
import { Model } from 'objection'

export class OrderItem extends BaseModel {
  static tableName = 'orderItems'

  public id!: string
  public orderId!: string
  public productId!: string
  public quantity!: number
  public price!: number

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
