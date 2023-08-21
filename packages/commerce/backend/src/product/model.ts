import { OrderItem } from '@/orderItem/model'
import { BaseModel } from '@/shared/model'
import { Model } from 'objection'

export class Product extends BaseModel {
  static tableName = 'products'

  public id!: string
  public name!: string
  public description!: string
  public slug!: string
  public price!: number
  public image!: string

  static relationMappings = () => ({
    orders: {
      relation: Model.HasManyRelation,
      modelClass: OrderItem,
      join: {
        from: 'products.id',
        to: 'orderItems.productId'
      }
    }
  })
}
