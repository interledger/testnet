import { OrderItem } from '@/order-item/model'
import { Payment } from '@/payment/model'
import { User } from '@/user/model'
import { Model, TransactionOrKnex } from 'objection'
import { BaseModel } from '@shared/backend'

export enum OrderStatus {
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export class Order extends BaseModel {
  static tableName = 'orders'

  public id!: string
  public userId!: string
  public quoteId!: string
  public total!: number
  public walletAddressUrl?: string
  public continueToken?: string
  public continueUri?: string
  public status!: OrderStatus
  public orderItems!: OrderItem[]
  public payments!: Payment

  async calculateTotalAmount(trx: TransactionOrKnex): Promise<Order> {
    const { totalAmount } = (await OrderItem.query(trx)
      .where({
        orderId: this.id
      })
      .select(
        trx.raw(
          'TRUNC(ROUND(SUM(quantity * price)::numeric, 2), 2)::float as "totalAmount"'
        )
      )
      .first()) as unknown as { totalAmount: number }

    await this.$query(trx).patch({ total: totalAmount })
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
    },

    payments: {
      relation: Model.HasOneRelation,
      modelClass: Payment,
      join: {
        from: 'orders.id',
        to: 'payments.orderId'
      }
    }
  })
}
