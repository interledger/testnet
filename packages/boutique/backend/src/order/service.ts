import { type OrderItem } from '@/order-item/model'
import { Order, OrderStatus } from './model'
import { TransactionOrKnex } from 'objection'
import { Logger } from 'winston'
import { InternalServerError, NotFound } from '@shared/backend'

interface OrderItemParams extends Pick<OrderItem, 'productId' | 'quantity'> {}

interface CreateParams {
  userId?: string
  orderItems: OrderItemParams[]
}

export interface IOrderService {
  create: (params: CreateParams, trx: TransactionOrKnex) => Promise<Order>
  delete: (id: string, trx: TransactionOrKnex) => Promise<Order | undefined>
  get: (id: string, userId?: string) => Promise<Order>
  ensurePendingState: (id: string) => Promise<Order>
  list: (userId: string) => Promise<Order[]>
  complete: (id: string, trx?: TransactionOrKnex) => Promise<Order | undefined>
  reject: (id: string, trx?: TransactionOrKnex) => Promise<Order | undefined>
  fail: (id: string, trx?: TransactionOrKnex) => Promise<Order | undefined>
}

export class OrderService implements IOrderService {
  constructor(private logger: Logger) {}

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

  public async delete(
    id: string,
    trx: TransactionOrKnex
  ): Promise<Order | undefined> {
    return Order.query(trx).deleteById(id).returning('*').first()
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

  public async ensurePendingState(id: string): Promise<Order> {
    const order = await this.get(id)
    if (order.status !== 'PROCESSING') {
      this.logger.error(
        `Trying to perform a checkout confirmation on a non-pending order (ID: ${id}).`
      )
      throw new InternalServerError()
    }
    return order.$query().withGraphFetched('payments')
  }

  public async list(userId: string): Promise<Order[]> {
    return await Order.query().where('userId', '=', userId)
  }

  public async complete(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.COMPLETED, trx)
  }

  public async reject(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.REJECTED, trx)
  }

  public async fail(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.FAILED, trx)
  }

  private async updateOrderStatus(
    id: string,
    status: OrderStatus,
    trx?: TransactionOrKnex
  ): Promise<Order | undefined> {
    const order = await Order.query(trx).findById(id)
    if (!order) return

    return await order.$query(trx).patchAndFetch({ status })
  }
}
