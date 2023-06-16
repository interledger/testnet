import { IncomingPaymentService } from '@/incomingPayment/service'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { Transaction } from '@/transaction/model'

interface IOutgoingPaymentService {
  create: (quoteId: string) => Promise<Transaction>
}

interface OutgoingServiceDependencies {
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(private deps: OutgoingServiceDependencies) {}

  async create(quoteId: string): Promise<Transaction> {
    const quote = await this.deps.rafikiClient.getQuote(quoteId)

    const paymentPointerId = quote.paymentPointerId

    const incomingPayment =
      await this.deps.incomingPaymentService.getPaymentDetailsByUrl(
        quote.receiver
      )
    const description = incomingPayment.description
    const assetCode = incomingPayment.assetCode
    const value = BigInt(incomingPayment.value)

    const payment = await this.deps.rafikiClient.createOutgoingPayment(
      paymentPointerId,
      quoteId,
      description
    )

    return Transaction.query().insert({
      paymentPointerId: paymentPointerId,
      paymentId: payment.id,
      assetCode,
      value: value,
      type: 'OUTGOING',
      status: 'PENDING',
      description
    })
  }
}
