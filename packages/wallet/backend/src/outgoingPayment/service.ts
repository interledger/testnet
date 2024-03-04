import { IncomingPaymentService } from '@/incomingPayment/service'
import { RafikiClient } from '@/rafiki/rafiki-client'

interface IOutgoingPaymentService {
  createByQuoteId: (quoteId: string) => Promise<void>
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(
    private rafikiClient: RafikiClient,
    private incomingPaymentService: IncomingPaymentService
  ) {}

  async createByQuoteId(quoteId: string): Promise<void> {
    const quote = await this.rafikiClient.getQuote(quoteId)
    const walletAddressId = quote.walletAddressId

    const incomingPayment =
      await this.incomingPaymentService.getPaymentDetailsByUrl(quote.receiver)
    const description = incomingPayment?.description

    await this.rafikiClient.createOutgoingPayment({
      walletAddressId,
      quoteId,
      metadata: { description }
    })
  }
}
