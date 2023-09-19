import { Order } from '@/order/model'
import { BaseModel } from '@/shared/model'
import { Model } from 'objection'

export class Payment extends BaseModel {
  static tableName = 'payments'

  public orderId!: string

  public quoteId!: string
  public incomingPaymentUrl!: string
  public interactUrl!: string
  public continueUri!: string
  public continueToken!: string
  public interactNonce!: string
  public clientNonce!: string
  public paymentPointer!: string

  static relationMappings = () => ({
    order: {
      relation: Model.BelongsToOneRelation,
      modelClass: Order,
      join: {
        from: 'payments.orderId',
        to: 'orders.id'
      }
    }
  })
}
