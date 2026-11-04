import { RhyzaAdminClient } from '@/rhyza/admin-client'

interface IOutgoingPaymentService {
  createByQuoteId: (
    quoteId: string,
    paymentIntentId: string,
    description?: string
  ) => Promise<void>
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(private rhyzaAdminClient: RhyzaAdminClient) {}

  async createByQuoteId(
    quoteId: string,
    paymentIntentId: string,
    description?: string
  ): Promise<void> {
    const quote = await this.rhyzaAdminClient.getQuoteById(
      paymentIntentId,
      quoteId
    )
    const walletAddress = quote.senderWalletAddress

    await this.rhyzaAdminClient.createPayment({
      walletAddress,
      quoteId,
      metadata: description ? { description } : undefined,
      paymentIntentId
    })
  }
}
