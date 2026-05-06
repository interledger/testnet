import { OrderItem } from '@/order-item/model'
import { Model } from 'objection'
import { BaseModel } from '@shared/backend'

export enum ProductType {
  ONE_TIME = 'ONE_TIME',
  SUBSCRIPTION = 'SUBSCRIPTION'
}

export enum BillingInterval {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export class Product extends BaseModel {
  static tableName = 'products'

  public id!: string
  public name!: string
  public description!: string
  public slug!: string
  public price!: number
  public image!: string
  public imageDark!: string
  public productType!: ProductType
  public billingInterval?: BillingInterval
  public billingIntervalCount?: number

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
