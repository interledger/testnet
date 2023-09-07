import { type OrderItem } from '@/orderItem/model'
import { Order, OrderStatus } from './model'
import { NotFound } from '@/errors'
import { TransactionOrKnex } from 'objection'

interface OrderItemParams extends Pick<OrderItem, 'productId' | 'quantity'> {}

interface CreateParams {
  userId?: string
  orderItems: OrderItemParams[]
}

export interface IOrderService {
  create: (params: CreateParams, trx: TransactionOrKnex) => Promise<Order>
  get: (id: string, userId?: string) => Promise<Order>
  list: (userId: string) => Promise<Order[]>
  complete: (id: string) => Promise<Order | undefined>
  reject: (id: string) => Promise<Order | undefined>
}

export class OrderService implements IOrderService {
  public async create(
    params: CreateParams,
    trx: TransactionOrKnex
  ): Promise<Order> {
    return await Order.query(trx)
      .insertGraph({
        ...params
      })
      .returning('*')
  }

  public async get(id: string, userId?: string): Promise<Order> {
    const row = Order.query().findById(id).withGraphFetched('orderItems')
    if (userId) row.where('userId', '=', userId)

    const order = await row

    if (!order) {
      throw new NotFound('Order was not found.')
    }
    return order
  }

  public async list(userId: string): Promise<Order[]> {
    return await Order.query().where('userId', '=', userId)
  }

  public async complete(id: string): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.COMPLETED)
  }

  public async reject(id: string): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.REJECTED)
  }

  private async updateOrderStatus(
    id: string,
    status: OrderStatus
  ): Promise<Order | undefined> {
    const order = await Order.query().findById(id)
    if (!order) return

    return await order.$query().patchAndFetch({ status })
  }

  public calculateTotalAmount(items: OrderItemParams[]): number {
    return items.reduce((total, item) => total + 2 * item.quantity, 0)
  }
}
