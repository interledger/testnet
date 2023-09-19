import { type OrderItem } from '@/order-item/model'
import { Order, OrderStatus } from './model'
import { InternalServerError, NotFound } from '@/errors'
import { TransactionOrKnex } from 'objection'
import { Logger } from 'winston'
import { Knex } from 'knex'

interface OrderItemParams extends Pick<OrderItem, 'productId' | 'quantity'> {}

interface CreateParams {
  userId?: string
  orderItems: OrderItemParams[]
}

export interface IOrderService {
  create: (params: CreateParams, trx: TransactionOrKnex) => Promise<Order>
  get: (id: string, userId?: string) => Promise<Order>
  ensurePendingState: (id: string) => Promise<Order>
  list: (userId: string) => Promise<Order[]>
  complete: (id: string) => Promise<Order | undefined>
  reject: (id: string) => Promise<Order | undefined>
  processPendingOrders: () => Promise<string | undefined>
}

export class OrderService implements IOrderService {
  constructor(
    private logger: Logger,
    private knex: Knex
  ) {}

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

  public async ensurePendingState(id: string): Promise<Order> {
    const order = await this.get(id)
    if (order.status !== 'PENDING') {
      this.logger.error(
        `Trying to perform a checkout confirmation on a non-pending order (ID: ${id}).`
      )
      throw new InternalServerError()
    }
    return order
  }

  public async list(userId: string): Promise<Order[]> {
    return await Order.query().where('userId', '=', userId)
  }

  public async complete(id: string): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.COMPLETED)
  }

  public async reject(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, OrderStatus.REJECTED, trx)
  }

  public async processPendingOrders(): Promise<string | undefined> {
    return this.knex.transaction(async (trx) => {
      const threshold = new Date(Date.now() - 1000 * 60 * 10) // 10 minutes
      const [order] = await Order.query(trx)
        .limit(1)
        .forUpdate()
        .skipLocked()
        .where({ status: OrderStatus.PENDING })
        .whereNotNull('createdAt')
        .andWhere('createdAt', '<=', threshold)

      if (!order) return
      await this.reject(order.id, trx)

      return order.id
    })
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
