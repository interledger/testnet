import { type OrderItem } from '@/orderItem/model'
import { Order, OrderStatus } from './model'
import { NotFound } from '@/errors'

interface OrderItemParams
  extends Pick<OrderItem, 'productId' | 'price' | 'quantity'> {}

interface CreateParams {
  quoteId: string
  userId?: string
  orderItems: OrderItemParams[]
}

export interface IOrderService {
  create: (params: CreateParams) => Promise<Order>
  get: (id: string, userId?: string) => Promise<Order>
  list: (userId: string) => Promise<Order[]>
  complete: (id: string) => Promise<Order | undefined>
  reject: (id: string) => Promise<Order | undefined>
}

export class OrderService implements IOrderService {
  public async create(params: CreateParams): Promise<Order> {
    const total = this.calculateTotalAmount(params.orderItems)

    return await Order.query()
      .insertGraph({
        total,
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

  private calculateTotalAmount(items: OrderItemParams[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }
}
