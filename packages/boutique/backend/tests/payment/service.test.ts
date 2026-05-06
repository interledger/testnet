import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { IOpenPayments } from '@/open-payments/service'
import { Order, OrderStatus } from '@/order/model'
import { Payment, PaymentStatus } from '@/payment/model'
import { IPaymentService } from '@/payment/service'
import { createApp, TestApp } from '@/tests/app'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { randomUUID } from 'crypto'
import { Knex } from 'knex'

describe('PaymentService', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let paymentService: IPaymentService
  let openPayments: IOpenPayments

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    paymentService = container.resolve('paymentService')
    openPayments = container.resolve('openPayments')
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    jest.restoreAllMocks()
    await truncateTables(knex)
  })

  test('reschedules an unreadable pending payment so later completed payments can still be processed', async () => {
    const blockedOrderId = randomUUID()
    const completedOrderId = randomUUID()

    await Order.query().insert([
      {
        id: blockedOrderId,
        total: 3.5,
        status: OrderStatus.PROCESSING
      },
      {
        id: completedOrderId,
        total: 3.5,
        status: OrderStatus.PROCESSING
      }
    ])

    const blockedPayment = await Payment.query().insert({
      orderId: blockedOrderId,
      quoteId: 'quote-blocked',
      incomingPaymentUrl: 'https://rafiki.example/incoming-payments/missing',
      continueUri: '',
      continueToken: '',
      interactUrl: '',
      interactNonce: '',
      clientNonce: '',
      walletAddress: 'https://wallet.example/alice',
      processAt: new Date(Date.now() - 1000),
      status: PaymentStatus.PENDING,
      attempts: 0
    })

    const completedPayment = await Payment.query().insert({
      orderId: completedOrderId,
      quoteId: 'quote-completed',
      incomingPaymentUrl: 'https://rafiki.example/incoming-payments/completed',
      continueUri: '',
      continueToken: '',
      interactUrl: '',
      interactNonce: '',
      clientNonce: '',
      walletAddress: 'https://wallet.example/alice',
      processAt: new Date(Date.now() - 1000),
      status: PaymentStatus.PENDING,
      attempts: 0
    })

    const incomingPaymentSpy = jest
      .spyOn(openPayments, 'getIncomingPayment')
      .mockRejectedValueOnce(new Error('payment does not exist'))
      .mockResolvedValueOnce({
        state: 'COMPLETED',
        incomingAmount: {
          value: '350',
          assetCode: 'USD',
          assetScale: 2
        },
        receivedAmount: {
          value: '350',
          assetCode: 'USD',
          assetScale: 2
        }
      } as never)

    expect(await paymentService.processPendingPayments()).toBe(blockedPayment.id)

    const rescheduledPayment = await Payment.query().findById(blockedPayment.id)
    expect(rescheduledPayment).toMatchObject({
      status: PaymentStatus.PENDING,
      attempts: 1
    })
    expect(rescheduledPayment?.processAt).not.toBeNull()
    expect(new Date(rescheduledPayment!.processAt as Date).getTime()).toBeGreaterThan(
      Date.now()
    )

    expect(await paymentService.processPendingPayments()).toBe(completedPayment.id)

    expect(incomingPaymentSpy).toHaveBeenNthCalledWith(
      1,
      'https://rafiki.example/incoming-payments/missing'
    )
    expect(incomingPaymentSpy).toHaveBeenNthCalledWith(
      2,
      'https://rafiki.example/incoming-payments/completed'
    )

    const refreshedCompletedPayment = await Payment.query().findById(
      completedPayment.id
    )
    const refreshedCompletedOrder = await Order.query().findById(completedOrderId)

    expect(refreshedCompletedPayment).toMatchObject({
      status: PaymentStatus.COMPLETED,
      processAt: null
    })
    expect(refreshedCompletedOrder).toMatchObject({
      status: OrderStatus.COMPLETED
    })
  })
})