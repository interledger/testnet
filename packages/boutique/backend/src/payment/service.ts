import { Knex } from 'knex'
import { Logger } from 'winston'
import { Payment, PaymentStatus } from './model'
import { IOpenPayments } from '@/open-payments/service'
import { IncomingPayment } from '@interledger/open-payments'
import { TransactionOrKnex } from 'objection'
import { IOrderService } from '@/order/service'
import { InternalServerError } from '@shared/backend'

export interface IPaymentService {
  get: (id: string) => Promise<Payment>
  fail: (payment: Payment, trx?: TransactionOrKnex) => Promise<void>
  complete: (payment: Payment, trx?: TransactionOrKnex) => Promise<void>
  processPendingPayments: () => Promise<string | undefined>
}

export class PaymentService implements IPaymentService {
  private readonly TRESHOLD_MS: number = 5000
  private readonly MAX_ATTEMPTS: number = 24

  constructor(
    private logger: Logger,
    private knex: Knex,
    private openPayments: IOpenPayments,
    private orderService: IOrderService
  ) {}

  public async get(id: string) {
    const payment = await Payment.query().select().findById(id)
    if (!payment) {
      this.logger.error(`Payment "${id}" not found`)
      throw new InternalServerError()
    }
    return payment
  }

  public async complete(payment: Payment, trx?: TransactionOrKnex) {
    await Promise.all([
      this.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED, trx),
      this.orderService.complete(payment.orderId, trx)
    ])
  }

  public async fail(payment: Payment, trx?: TransactionOrKnex): Promise<void> {
    const promise =
      payment.attempts < 5
        ? this.orderService.reject(payment.orderId, trx)
        : this.orderService.fail(payment.orderId, trx)
    await Promise.all([
      this.updatePaymentStatus(payment.id, PaymentStatus.FAILED, trx),
      promise,
      payment.$query(trx).patch({ processAt: null })
    ])
  }

  private ensurePaymentIsCompleted(
    incomingPayment: IncomingPayment,
    orderTotal: number
  ): boolean {
    const { receivedAmount } = incomingPayment
    const convertedTotal = (
      orderTotal *
      10 ** incomingPayment.receivedAmount.assetScale
    ).toFixed()

    if (BigInt(convertedTotal) !== BigInt(receivedAmount.value)) {
      return false
    }

    return true
  }

  private async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    trx?: TransactionOrKnex
  ): Promise<Payment | undefined> {
    const payment = await Payment.query(trx).findById(id)
    if (!payment) return

    return await payment.$query(trx).patchAndFetch({ status })
  }

  public async processPendingPayments(): Promise<string | undefined> {
    return this.knex.transaction(async (trx) => {
      const now = new Date(Date.now()).toISOString()
      const [payment] = await Payment.query(trx)
        .limit(1)
        .forUpdate()
        .skipLocked()
        .where({ status: PaymentStatus.PENDING })
        .whereNotNull('processAt')
        .andWhere('processAt', '<=', now)
        .withGraphFetched('order')

      if (!payment) return

      const incomingPayment = await this.openPayments.getIncomingPayment(
        payment.incomingPaymentUrl
      )

      if (payment.attempts === this.MAX_ATTEMPTS) {
        await this.fail(payment, trx)
        return payment.id
      }

      if (this.ensurePaymentIsCompleted(incomingPayment, payment.order.total)) {
        await Promise.all([
          this.complete(payment, trx),
          payment.$query(trx).patch({ processAt: null })
        ])
      } else {
        await payment.$query(trx).patch({
          attempts: payment.attempts + 1,
          processAt: new Date(Date.now() + this.TRESHOLD_MS)
        })
      }
      return payment.id
    })
  }
}
