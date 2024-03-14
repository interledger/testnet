import { Order } from '@/order/model'
import { Model, QueryContext } from 'objection'
import { BaseModel } from '@shared/backend/src/model'

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

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
  public walletAddress!: string
  public processAt!: Date | null
  public status!: PaymentStatus
  public order!: Order
  public attempts!: number

  public $beforeInsert(context: QueryContext): void {
    super.$beforeInsert(context)
    this.processAt = new Date()
  }

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
