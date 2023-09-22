import { IncomingPaymentService } from '@/incomingPayment/service'
import { RafikiClient } from '@/rafiki/rafiki-client'

interface IOutgoingPaymentService {
  createByQuoteId: (quoteId: string) => Promise<void>
}

interface OutgoingServiceDependencies {
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(private deps: OutgoingServiceDependencies) {}

  async createByQuoteId(quoteId: string): Promise<void> {
    const quote = await this.deps.rafikiClient.getQuote(quoteId)
    const paymentPointerId = quote.paymentPointerId

    const incomingPayment =
      await this.deps.incomingPaymentService.getPaymentDetailsByUrl(
        quote.receiver
      )
    const { description } = incomingPayment

    await this.deps.rafikiClient.createOutgoingPayment({
      paymentPointerId,
      quoteId,
      metadata: { description }
    })
  }
}
