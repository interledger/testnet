import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { Quote } from '@/rhyza/types'
import { OutgoingPaymentService } from '@/outgoingPayment/service'

describe('OutgoingPaymentService', () => {
  const quoteId = 'quote-1'
  const paymentIntentId = 'payment-intent-1'
  const description = 'Free Money!'
  const quote: Quote = {
    createdAt: '2026-11-02T10:00:00.000Z',
    id: quoteId,
    paymentIntentId,
    senderWalletAddress: 'https://ilp.test/alice',
    senderWalletAddressId: 'wallet-address-1',
    state: 'COMPLETED',
    debitAmount: '150',
    receiveAmount: '150'
  }

  let getQuoteById: jest.Mock
  let createPayment: jest.Mock
  let service: OutgoingPaymentService

  beforeEach(() => {
    getQuoteById = jest.fn().mockResolvedValue(quote)
    createPayment = jest.fn().mockResolvedValue({
      id: 'payment-1',
      paymentIntentId
    })

    const rhyzaAdminClient = {
      getQuoteById,
      createPayment
    } as unknown as RhyzaAdminClient

    service = new OutgoingPaymentService(rhyzaAdminClient)
  })

  it('gets the quote and creates a payment using the quote sender address', async () => {
    await service.createByQuoteId(quoteId, paymentIntentId, description)

    expect(getQuoteById).toHaveBeenCalledWith(paymentIntentId, quoteId)
    expect(createPayment).toHaveBeenCalledWith({
      walletAddress: quote.senderWalletAddress,
      quoteId,
      metadata: { description },
      paymentIntentId
    })
  })

  it('creates a payment without metadata when no description is provided', async () => {
    await service.createByQuoteId(quoteId, paymentIntentId)

    expect(createPayment).toHaveBeenCalledWith({
      walletAddress: quote.senderWalletAddress,
      quoteId,
      metadata: undefined,
      paymentIntentId
    })
  })

  it('does not create a payment if the quote lookup fails', async () => {
    const lookupError = new Error('Quote not found')
    getQuoteById.mockRejectedValueOnce(lookupError)

    await expect(
      service.createByQuoteId(quoteId, paymentIntentId, description)
    ).rejects.toBe(lookupError)

    expect(createPayment).not.toHaveBeenCalled()
  })
})
