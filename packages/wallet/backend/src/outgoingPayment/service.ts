import { NotFound } from '@/errors'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { PaymentPointer } from '@/paymentPointer/model'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { Transaction } from '@/transaction/model'

interface IOutgoingPaymentService {
  createByQuoteId: (quoteId: string) => Promise<Transaction>
}

interface OutgoingServiceDependencies {
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(private deps: OutgoingServiceDependencies) {}

  async createByQuoteId(quoteId: string): Promise<Transaction> {
    const quote = await this.deps.rafikiClient.getQuote(quoteId)

    const value = quote.sendAmount.value
    const paymentPointerId = quote.paymentPointerId

    const incomingPayment =
      await this.deps.incomingPaymentService.getPaymentDetailsByUrl(
        quote.receiver
      )
    const { description, assetCode } = incomingPayment

    const payment = await this.deps.rafikiClient.createOutgoingPayment({
      paymentPointerId,
      quoteId,
      metadata: { description }
    })

    const paymentPointer = await PaymentPointer.query()
      .findById(paymentPointerId)
      .select('accountId', 'active')

    if (!paymentPointer?.active) {
      throw new NotFound()
    }

    return Transaction.query().insert({
      paymentPointerId,
      paymentId: payment.id,
      assetCode,
      accountId: paymentPointer.accountId,
      value,
      type: 'OUTGOING',
      status: 'PENDING',
      description
    })
  }
}
