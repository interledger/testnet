import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
import { IOrderService } from '@/order/service'
import { truncateTables } from '@/tests/tables'
import { randomUUID } from 'crypto'
import { mockProduct } from '../mocks'
import { createProducts } from '../helpers'
import { OrderStatus, type Order } from '@/order/model'
import { IUserService } from '@/user/service'
import { deleteProperty } from '@/shared/utils'
import { NotFound } from '@/errors'

describe('Order Service', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let userService: IUserService
  let orderService: IOrderService
  let order: Order

  const paymentPointer = 'https://ilp.example.com'
  const productOne = mockProduct()
  const productTwo = mockProduct({ name: 'Product #2', price: 20 })
  const orderItems = [
    {
      productId: productOne.id,
      quantity: 5
    },
    {
      productId: productTwo.id,
      quantity: 3
    }
  ]

  async function createOrder(): Promise<Order> {
    await createProducts([productOne, productTwo])

    const user = await userService.create(paymentPointer)
    return await orderService.create(
      {
        userId: user.id,
        orderItems
      },
      app.knex
    )
  }

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    userService = container.resolve('userService')
    orderService = container.resolve('orderService')
  })

  beforeEach(async (): Promise<void> => {
    order = await createOrder()
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('create', (): void => {
    test('can create an order without a user ID', async (): Promise<void> => {
      const params = {
        quoteId: randomUUID(),
        orderItems
      }
      const order = await orderService.create(params, app.knex)

      expect(order).toMatchObject(params)
      expect(order.userId).toBeNull()
    })

    test('can create an order with a user ID', async (): Promise<void> => {
      const user = await userService.create(paymentPointer + '/alice')
      const params = {
        userId: user.id,
        orderItems
      }
      const order = await orderService.create(params, app.knex)

      expect(order).toMatchObject(params)
      expect(order.userId).toEqual(params.userId)
    })
  })

  describe('get', (): void => {
    it('throws a NotFound exception if the order does not exist', async (): Promise<void> => {
      await expect(orderService.get(randomUUID())).rejects.toThrowError(
        NotFound
      )
    })

    it('throws a NotFound exception if the order does not belong to the current user', async (): Promise<void> => {
      await expect(
        orderService.get(order.id, randomUUID())
      ).rejects.toThrowError(NotFound)
    })

    it('should return the order with the given id', async (): Promise<void> => {
      await expect(orderService.get(order.id)).resolves.toStrictEqual(order)
    })

    it('should return the order that belongs tot the current user', async (): Promise<void> => {
      await expect(
        orderService.get(order.id, order.userId)
      ).resolves.toMatchObject(order)
    })
  })

  describe('list', (): void => {
    it('should return an empty array if the user does not have any orders', async (): Promise<void> => {
      await expect(orderService.list(randomUUID())).resolves.toEqual([])
    })

    it("should return the user's orders", async (): Promise<void> => {
      const expected = deleteProperty(order, 'orderItems')
      await expect(orderService.list(order.userId)).resolves.toEqual([expected])
    })
  })

  describe('complete', (): void => {
    it('should update the order status to "COMPLETED"', async (): Promise<void> => {
      const completedOrder = await orderService.complete(order.id)
      expect(completedOrder?.status).toBe(OrderStatus.COMPLETED)
    })

    it('should return undefined when trying to update a non-existing order status to "COMPLETED"', async (): Promise<void> => {
      const completedOrder = await orderService.complete(randomUUID())
      expect(completedOrder?.status).toBeUndefined()
    })
  })

  describe('reject', (): void => {
    it('should update the order status to "REJECTED"', async (): Promise<void> => {
      const completedOrder = await orderService.reject(order.id)
      expect(completedOrder?.status).toBe(OrderStatus.REJECTED)
    })

    it('should return undefined when trying to update a non-existing order status to "REJECTED"', async (): Promise<void> => {
      const completedOrder = await orderService.reject(randomUUID())
      expect(completedOrder?.status).toBeUndefined()
    })
  })

  test('total should be the sum of the order items', async (): Promise<void> => {
    const orderTotalAmount = order.orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    )
    expect(order.total).toStrictEqual(orderTotalAmount)
  })
})
