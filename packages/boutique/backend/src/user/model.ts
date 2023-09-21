import { Order } from '@/order/model'
import { BaseModel } from '@/shared/model'
import { Model } from 'objection'

export class User extends BaseModel {
  static tableName = 'users'

  public id!: string
  public paymentPointer!: string
  public token!: string

  static relationMappings = () => ({
    orders: {
      relation: Model.HasManyRelation,
      modelClass: Order,
      join: {
        from: 'users.id',
        to: 'orders.userId'
      }
    }
  })
}
