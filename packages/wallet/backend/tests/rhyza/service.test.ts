import { RhyzaService } from '@/rhyza/service'
import type { TransactionService } from '@/transaction/service'
import type { WalletAddressService } from '@/walletAddress/service'
import type { Logger } from 'winston'
import { mockPaymentIntentCreatedEvent } from '../mocks'

describe('Rhyza Service', () => {
  describe('OnWebHook', () => {
    let service: RhyzaService
    let paymentIntentEvent: ReturnType<typeof mockPaymentIntentCreatedEvent>
    let walletAddress: { id: string }
    let transactionService: {
      createIncomingTransaction: jest.Mock
    }
    let walletAddressService: {
      findByIdWithoutValidation: jest.Mock
    }

    beforeEach(() => {
      paymentIntentEvent = mockPaymentIntentCreatedEvent()
      walletAddress = { id: paymentIntentEvent.data.walletAddressId }
      transactionService = {
        createIncomingTransaction: jest.fn().mockResolvedValue(undefined)
      }
      walletAddressService = {
        findByIdWithoutValidation: jest.fn().mockResolvedValue(walletAddress)
      }
      const logger = { info: jest.fn() }
      service = new RhyzaService(
        logger as unknown as Logger,
        transactionService as unknown as TransactionService,
        walletAddressService as unknown as WalletAddressService
      )
    })

    it('should create an incoming transaction on payment intent created', async () => {
      await service.onWebHook(paymentIntentEvent)

      expect(
        walletAddressService.findByIdWithoutValidation
      ).toHaveBeenCalledWith(paymentIntentEvent.data.walletAddressId)
      expect(transactionService.createIncomingTransaction).toHaveBeenCalledWith(
        paymentIntentEvent.data,
        walletAddress
      )
    })
  })
})
