import { OrderItem } from '@/order-item/model'
import { Model } from 'objection'
import { BaseModel } from '@shared/backend'

export class Product extends BaseModel {
  static tableName = 'products'

  public id!: string
  public name!: string
  public description!: string
  public slug!: string
  public price!: number
  public image!: string
  public imageDark!: string

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
