import { OrderItem } from '@/orderItem/model'
import { BaseModel } from '@/shared/model'
import { User } from '@/user/model'
import { Model } from 'objection'

export enum OrderStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export class Order extends BaseModel {
  static tableName = 'orders'

  public id!: string
  public userId!: string
  public quoteId!: string
  public total!: number
  public status!: OrderStatus
  public orderItems!: OrderItem[]

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'orders.userId',
        to: 'user.id'
      }
    },

    orderItems: {
      relation: Model.HasManyRelation,
      modelClass: OrderItem,
      join: {
        from: 'orders.id',
        to: 'orderItems.orderId'
      }
    }
  })
}
