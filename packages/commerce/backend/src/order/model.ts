import { OrderItem } from '@/orderItem/model'
import { BaseModel } from '@/shared/model'
import { User } from '@/user/model'
import { Model, TransactionOrKnex } from 'objection'

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

  async calcaulateTotalAmount(trx: TransactionOrKnex): Promise<Order> {
    const { totalAmount } = (await OrderItem.query(trx)
      .where({
        orderId: this.id
      })
      .select(
        trx.raw(
          'TRUNC(ROUND(SUM(quantity * price)::numeric, 2), 2)::float as "totalAmount"'
        )
      )
      .first()
      .debug()) as unknown as { totalAmount: number }
    console.log(typeof totalAmount)
    this.total = totalAmount
    return this
  }

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
