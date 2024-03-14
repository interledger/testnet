import { Order } from '@/order/model'
import { Model } from 'objection'
import { BaseModel } from '@shared/backend/src/model'

export class User extends BaseModel {
  static tableName = 'users'

  public id!: string
  public walletAddress!: string
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
