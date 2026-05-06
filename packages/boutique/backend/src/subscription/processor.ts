import { IOpenPayments } from '@/open-payments/service'
import { IOrderService } from '@/order/service'
import { Order, OrderStatus } from '@/order/model'
import { BillingInterval } from '@/product/model'
import { Knex } from 'knex'
import { OpenPaymentsClientError } from '@interledger/open-payments'
import { Logger } from 'winston'
import { BadRequest, NotFound } from '@shared/backend'
import {
  getNextBillingDate,
  getNextBillingDateFromGrantInterval,
  Subscription,
  SubscriptionStatus
} from './model'
import {
  buildSubscriptionPaymentMetadata,
  getNextSubscriptionPaymentNumber
} from './payment-metadata'

export interface ISubscriptionProcessor {
  processDueSubscriptions: () => Promise<string | undefined>
  retrySubscription: (id: string) => Promise<Subscription>
}

export class SubscriptionProcessor implements ISubscriptionProcessor {
  private readonly RETRY_DELAY_MS: number = 1000 * 60 * 60 * 24

  constructor(
    private logger: Logger,
    private knex: Knex,
    private openPayments: IOpenPayments,
    private orderService: IOrderService
  ) {}

  public async processDueSubscriptions(): Promise<string | undefined> {
    return await this.knex.transaction(async (trx) => {
      const now = new Date(Date.now()).toISOString()

      const [subscription] = await Subscription.query(trx)
        .limit(1)
        .forUpdate()
        .skipLocked()
        .whereIn('status', [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PAST_DUE
        ])
        .whereNotNull('nextBillingAt')
        .andWhere('nextBillingAt', '<=', now)
        .withGraphFetched('product')

      if (!subscription) return

      await this.processSubscription(subscription, trx)

      return subscription.id
    })
  }

  public async retrySubscription(id: string): Promise<Subscription> {
    return await this.knex.transaction(async (trx) => {
      const subscription = await Subscription.query(trx)
        .findById(id)
        .forUpdate()
        .withGraphFetched('product')

      if (!subscription) {
        throw new NotFound('Subscription was not found.')
      }

      if (subscription.status !== SubscriptionStatus.PAST_DUE) {
        throw new BadRequest('Only past due subscriptions can be retried.')
      }

      await this.processSubscription(subscription, trx)

      return await Subscription.query(trx)
        .findById(subscription.id)
        .withGraphFetched('[product, latestOrder.payments]')
        .throwIfNotFound()
    })
  }

  private async markPastDue(subscription: Subscription, trx: Knex.Transaction) {
    await subscription.$query(trx).patch({
      status: SubscriptionStatus.PAST_DUE,
      retryCount: subscription.retryCount + 1,
      nextBillingAt: new Date(Date.now() + this.RETRY_DELAY_MS)
    })
  }

  private async processSubscription(
    subscription: Subscription,
    trx: Knex.Transaction
  ): Promise<void> {
    let renewalOrder: Order | undefined

    if (
      !subscription.accessToken ||
      !subscription.manageUrl ||
      (!subscription.grantInterval &&
        (!subscription.product.billingInterval ||
          !subscription.product.billingIntervalCount))
    ) {
      await this.markPastDue(subscription, trx)
      return
    }

    try {
      renewalOrder = await this.orderService.create(
        {
          subscriptionId: subscription.id,
            paymentNumber: subscription.currentPeriodNumber,
            totalPayments: subscription.totalPayments,
          orderItems: [
            {
              productId: subscription.productId,
                quantity: subscription.quantity
            }
          ]
        },
        trx
      )

        renewalOrder = await renewalOrder.$query(trx).patchAndFetch({
          total: subscription.amount
        })

      const tokenInfo = await this.openPayments.instantBuy({
        order: renewalOrder,
        accessToken: subscription.accessToken,
        manageUrl: subscription.manageUrl,
        walletAddressUrl: subscription.walletAddress,
        paymentMetadata: buildSubscriptionPaymentMetadata(renewalOrder),
        trx
      })

      const nextBillingAt = this.getNextBillingAt(subscription)
      const currentPeriodNumber = getNextSubscriptionPaymentNumber({
        currentPeriodNumber: subscription.currentPeriodNumber,
        hasNextBillingAt: Boolean(nextBillingAt)
      })

      await subscription.$query(trx).patch({
        retryCount: 0,
        status: SubscriptionStatus.ACTIVE,
        latestOrderId: renewalOrder.id,
        accessToken: tokenInfo.accessToken,
        manageUrl: tokenInfo.manageUrl,
        nextBillingAt: nextBillingAt ?? null,
        currentPeriodNumber
      })
    } catch (err) {
      if (renewalOrder) {
        await renewalOrder
          .$query(trx)
          .patch({ status: OrderStatus.FAILED })
          .catch((orderErr) => {
            this.logger.error(
              `Could not mark renewal order ${renewalOrder!.id} as failed.`
            )
            this.logger.error(orderErr)
          })
      }

      if (err instanceof OpenPaymentsClientError && err.status === 401) {
        this.logger.warn(
          `Subscription ${subscription.id} authorization expired, marking as past due.`
        )
      } else {
        this.logger.error(
          `Error while processing subscription renewal ${subscription.id}.`
        )
        this.logger.error(err)
      }

      await this.markPastDue(subscription, trx)
    }
  }

  private getNextBillingAt(subscription: Subscription): Date | undefined {
    if (subscription.grantInterval) {
      return getNextBillingDateFromGrantInterval(
        subscription.grantInterval,
        new Date()
      )
    }

    return getNextBillingDate(
      new Date(),
      subscription.product.billingInterval as BillingInterval,
      subscription.product.billingIntervalCount as number
    )
  }
}
