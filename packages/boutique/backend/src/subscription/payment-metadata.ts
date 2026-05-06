import { Order } from '@/order/model'
import { OutgoingPaymentMetadata } from '@/open-payments/service'

export function buildSubscriptionPaymentMetadata(
  order: Pick<Order, 'id' | 'paymentNumber' | 'totalPayments' | 'subscriptionId'>
): OutgoingPaymentMetadata {
  const paymentNumber = order.paymentNumber ?? 1

  if (typeof order.totalPayments === 'number') {
    return {
      description: `Installment ${paymentNumber} of ${order.totalPayments} at Test Boutique`,
      orderRef: order.id,
      subscriptionId: order.subscriptionId,
      paymentNumber,
      totalPayments: order.totalPayments,
      type: 'installment'
    }
  }

  return {
    description: `Subscription payment ${paymentNumber} at Test Boutique`,
    orderRef: order.id,
    subscriptionId: order.subscriptionId,
    paymentNumber,
    type: 'subscription'
  }
}

export function getNextSubscriptionPaymentNumber(params: {
  currentPeriodNumber?: number
  hasNextBillingAt: boolean
}): number {
  const currentPeriodNumber = params.currentPeriodNumber ?? 1

  return params.hasNextBillingAt
    ? currentPeriodNumber + 1
    : currentPeriodNumber
}