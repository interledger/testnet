import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { WalletAddress } from '@/walletAddress/model'
import { AccountService } from '@/account/service'
import { BadRequest, NotFound } from '@shared/backend'

type CreateByQuoteIdParams = {
  userId: string
  quoteId: string
  paymentIntentId: string
  description?: string
}

interface IOutgoingPaymentService {
  createByQuoteId: (params: CreateByQuoteIdParams) => Promise<void>
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(
    private rhyzaAdminClient: RhyzaAdminClient,
    private accountService: AccountService
  ) {}

  async createByQuoteId(params: CreateByQuoteIdParams): Promise<void> {
    const quote = await this.rhyzaAdminClient.getQuote(
      params.paymentIntentId,
      params.quoteId
    )

    if (quote.state !== 'COMPLETED') {
      throw new BadRequest('Quote is not valid')
    }
    if (quote.expiresAt && new Date(quote.expiresAt) <= new Date()) {
      throw new BadRequest('Quote has expired')
    }

    // Match by URL: older wallet addresses keep their Rafiki id locally.
    const walletAddress = await WalletAddress.query().findOne({
      url: quote.senderWalletAddress
    })
    if (!walletAddress) {
      throw new NotFound()
    }
    if (!walletAddress.active) {
      throw new BadRequest('Invalid wallet address')
    }
    await this.accountService.findAccountById(
      walletAddress.accountId,
      params.userId
    )

    await this.rhyzaAdminClient.createPayment({
      walletAddress: quote.senderWalletAddress,
      paymentIntentId: quote.paymentIntentId,
      quoteId: quote.id,
      metadata: params.description
        ? { description: params.description }
        : undefined
    })
  }
}
