import { RhyzaService } from '@/rhyza/service'
import type { TransactionService } from '@/transaction/service'
import type { WalletAddressService } from '@/walletAddress/service'
import type { Logger } from 'winston'
import type { GateHubClient } from '@/gatehub/client'
import type { AccountService } from '@/account/service'
import type { SocketService } from '@/socket/service'
import type { Env } from '@/config/env'
import type { RhyzaAdminClient } from '@/rhyza/admin-client'
import MessageType from '@/socket/messageType'
import {
  mockPaymentCompletedEvent,
  mockPaymentCreatedEvent,
  mockPaymentFailedEvent,
  mockPaymentIntentCompletedEvent,
  mockPaymentIntentCreatedEvent
} from '../mocks'
import { InterledgerCardService } from '@/interledgerCard/service'

describe('Rhyza Service', () => {
  describe('OnWebHook', () => {
    let service: RhyzaService
    let walletAddress: {
      id: string
      accountId: string
      url: string
    }
    let transactionService: {
      createIncomingTransaction: jest.Mock
      createOutgoingTransaction: jest.Mock
      updateTransaction: jest.Mock
    }
    let walletAddressService: {
      findByIdWithoutValidation: jest.Mock
      getByUrl: jest.Mock
    }
    let socketService: {
      emitMoneyReceivedByUserId: jest.Mock
      emitMoneySentByUserId: jest.Mock
    }
    let gateHubClient: {
      createTransaction: jest.Mock
      getVaultUuid: jest.Mock
      getWalletBalance: jest.Mock
    }
    let interledgerCardService: {
      findActiveCardByWalletAddress: jest.Mock
      processCardPayment: jest.Mock
    }
    let accountService: { getGateHubWalletAddress: jest.Mock }
    let rhyzaAdminClient: {
      listPayments: jest.Mock
      cancelPayment: jest.Mock
      getPaymentIntentById: jest.Mock
      approvePayment: jest.Mock
    }

    beforeEach(() => {
      walletAddress = {
        id: 'wallet-address-id',
        accountId: 'account-id',
        url: 'https://wallet.test/sender'
      }
      transactionService = {
        createIncomingTransaction: jest.fn().mockResolvedValue(undefined),
        createOutgoingTransaction: jest.fn().mockResolvedValue(undefined),
        updateTransaction: jest.fn().mockResolvedValue(undefined)
      }
      walletAddressService = {
        findByIdWithoutValidation: jest.fn().mockResolvedValue(walletAddress),
        getByUrl: jest.fn().mockResolvedValue(undefined)
      }
      socketService = {
        emitMoneyReceivedByUserId: jest.fn(),
        emitMoneySentByUserId: jest.fn()
      }
      gateHubClient = {
        createTransaction: jest.fn().mockResolvedValue(undefined),
        getVaultUuid: jest.fn().mockReturnValue('vault-id'),
        getWalletBalance: jest
          .fn()
          .mockResolvedValue([
            { vault: { asset_code: 'USD' }, available: '100' }
          ])
      }
      accountService = {
        getGateHubWalletAddress: jest.fn().mockResolvedValue({
          gateHubWalletId: 'user-wallet-id',
          userId: 'user-id',
          gateHubUserId: 'gatehub-user-id'
        })
      }
      interledgerCardService = {
        findActiveCardByWalletAddress: jest
          .fn()
          .mockResolvedValue({ id: 'card-id' }),
        processCardPayment: jest.fn().mockResolvedValue(true)
      }
      rhyzaAdminClient = {
        listPayments: jest.fn().mockResolvedValue({ result: [] }),
        cancelPayment: jest.fn().mockResolvedValue({ id: 'payment-id' }),
        getPaymentIntentById: jest
          .fn()
          .mockResolvedValue({ walletAddress: 'https://wallet.test/receiver' }),
        approvePayment: jest
          .fn()
          .mockResolvedValue({ id: 'payment-id', state: 'PROCESSING' })
      }

      const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
      service = new RhyzaService(
        socketService as unknown as SocketService,
        gateHubClient as unknown as GateHubClient,
        {
          GATEHUB_SETTLEMENT_WALLET_ADDRESS: 'settlement-wallet'
        } as Env,
        logger as unknown as Logger,
        transactionService as unknown as TransactionService,
        walletAddressService as unknown as WalletAddressService,
        accountService as unknown as AccountService,
        interledgerCardService as unknown as InterledgerCardService,
        rhyzaAdminClient as unknown as RhyzaAdminClient
      )
    })

    it('should create an incoming transaction on payment intent created', async () => {
      const paymentIntentEvent = mockPaymentIntentCreatedEvent({
        data: { walletAddressId: walletAddress.id }
      })

      await service.onWebHook(paymentIntentEvent)

      expect(
        walletAddressService.findByIdWithoutValidation
      ).toHaveBeenCalledWith(paymentIntentEvent.data.walletAddressId)
      expect(transactionService.createIncomingTransaction).toHaveBeenCalledWith(
        paymentIntentEvent.data,
        walletAddress
      )
    })

    it('should settle and complete a payment intent and notify its recipient', async () => {
      const paymentIntentEvent = mockPaymentIntentCompletedEvent({
        data: {
          id: 'payment-intent-id',
          walletAddressId: walletAddress.id,
          receivedAmount: {
            value: '1234',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })
      const senderUrl = 'https://wallet.test/sender'
      const senderWalletAddress = {
        url: senderUrl,
        account: {
          user: { firstName: 'Sender', lastName: 'Person' }
        }
      }
      rhyzaAdminClient.listPayments.mockResolvedValue({
        result: [
          { senderWalletAddress: senderUrl },
          { senderWalletAddress: senderUrl }
        ]
      })
      walletAddressService.getByUrl.mockResolvedValue(senderWalletAddress)

      await service.onWebHook(paymentIntentEvent)

      expect(gateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: 12.34,
        vault_uuid: 'vault-id',
        receiving_address: 'user-wallet-id',
        sending_address: 'settlement-wallet',
        type: expect.anything(),
        message: 'Transfer'
      })
      expect(rhyzaAdminClient.listPayments).toHaveBeenCalledWith({
        paymentIntentId: 'payment-intent-id',
        first: 100
      })
      expect(walletAddressService.getByUrl).toHaveBeenCalledTimes(1)
      expect(walletAddressService.getByUrl).toHaveBeenCalledWith(senderUrl)
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-intent-id' },
        {
          status: 'COMPLETED',
          value: 1234n,
          secondParty: 'Sender Person',
          secondPartyWA: senderUrl
        }
      )
      expect(socketService.emitMoneyReceivedByUserId).toHaveBeenCalledWith(
        'user-id',
        {
          value: '1234',
          assetCode: 'USD',
          assetScale: 2
        }
      )
    })

    it('should preserve sender addresses when they are not local wallet addresses', async () => {
      const paymentIntentEvent = mockPaymentIntentCompletedEvent({
        data: {
          id: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      const externalSenderUrl = 'https://external.test/sender'
      rhyzaAdminClient.listPayments.mockResolvedValue({
        result: [{ senderWalletAddress: externalSenderUrl }]
      })

      await service.onWebHook(paymentIntentEvent)

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-intent-id' },
        expect.objectContaining({
          secondParty: '',
          secondPartyWA: externalSenderUrl
        })
      )
    })

    it('should skip settlement and completion for a zero amount', async () => {
      const paymentIntentEvent = mockPaymentIntentCompletedEvent({
        data: {
          id: 'payment-intent-id',
          walletAddressId: walletAddress.id,
          receivedAmount: {
            value: '0',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })

      await service.onWebHook(paymentIntentEvent)

      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
    })

    it('should complete the transaction if sender lookup fails', async () => {
      const paymentIntentEvent = mockPaymentIntentCompletedEvent({
        data: {
          id: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      rhyzaAdminClient.listPayments.mockRejectedValue(
        new Error('Rhyza payments lookup failed')
      )

      await service.onWebHook(paymentIntentEvent)

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-intent-id' },
        {
          status: 'COMPLETED',
          value: 1000n,
          secondParty: undefined,
          secondPartyWA: undefined
        }
      )
    })

    it('should settle a completed payment and notify its sender', async () => {
      const paymentEvent = mockPaymentCompletedEvent({
        data: {
          id: 'payment-id',
          walletAddressId: walletAddress.id,
          debitAmount: {
            value: '1234',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(
        walletAddressService.findByIdWithoutValidation
      ).toHaveBeenCalledWith(walletAddress.id)
      expect(gateHubClient.createTransaction).toHaveBeenCalledWith(
        {
          amount: 12.34,
          vault_uuid: 'vault-id',
          sending_address: 'user-wallet-id',
          receiving_address: 'settlement-wallet',
          type: expect.anything(),
          message: 'Transfer'
        },
        'gatehub-user-id'
      )
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id' },
        { status: 'COMPLETED', value: 1234n }
      )
      expect(socketService.emitMoneySentByUserId).toHaveBeenCalledWith(
        'user-id',
        {
          value: '1234',
          assetCode: 'USD',
          assetScale: 2
        },
        MessageType.MONEY_SENT
      )
    })

    it('should notify with the shop message type for instant payments', async () => {
      const paymentEvent = mockPaymentCompletedEvent({
        data: {
          walletAddressId: walletAddress.id,
          metadata: { type: 'instant' }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(socketService.emitMoneySentByUserId).toHaveBeenCalledWith(
        'user-id',
        expect.anything(),
        MessageType.MONEY_SENT_SHOP
      )
    })

    it('should skip settlement and completion for a zero debit amount', async () => {
      const paymentEvent = mockPaymentCompletedEvent({
        data: {
          walletAddressId: walletAddress.id,
          debitAmount: {
            value: '0',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
      expect(socketService.emitMoneySentByUserId).not.toHaveBeenCalled()
    })

    it('should not complete a payment if the GateHub settlement fails', async () => {
      const paymentEvent = mockPaymentCompletedEvent({
        data: { walletAddressId: walletAddress.id }
      })
      gateHubClient.createTransaction.mockRejectedValue(
        new Error('GateHub transfer failed')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toThrow(
        'GateHub transfer failed'
      )

      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
      expect(socketService.emitMoneySentByUserId).not.toHaveBeenCalled()
    })

    it('should not settle a payment for a wallet address without a GateHub account', async () => {
      const paymentEvent = mockPaymentCompletedEvent({
        data: { walletAddressId: walletAddress.id }
      })
      accountService.getGateHubWalletAddress.mockRejectedValue(
        new Error('No account associated to the provided wallet address')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toThrow(
        'No account associated to the provided wallet address'
      )

      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
    })

    it('should mark a failed payment with nothing sent as failed', async () => {
      const paymentEvent = mockPaymentFailedEvent({
        data: { id: 'payment-id', walletAddressId: walletAddress.id }
      })

      await service.onWebHook(paymentEvent)

      expect(transactionService.updateTransaction).toHaveBeenCalledTimes(1)
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id' },
        { status: 'FAILED', value: 0n }
      )
      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(socketService.emitMoneySentByUserId).not.toHaveBeenCalled()
    })

    it('should settle the sent amount of a partially sent failed payment', async () => {
      const paymentEvent = mockPaymentFailedEvent({
        data: {
          id: 'payment-id',
          walletAddressId: walletAddress.id,
          sentAmount: {
            value: '500',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(gateHubClient.createTransaction).toHaveBeenCalledWith(
        {
          amount: 5,
          vault_uuid: 'vault-id',
          sending_address: 'user-wallet-id',
          receiving_address: 'settlement-wallet',
          type: expect.anything(),
          message: 'Transfer'
        },
        'gatehub-user-id'
      )
      expect(transactionService.updateTransaction).toHaveBeenCalledTimes(1)
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id' },
        { status: 'COMPLETED', value: 500n }
      )
    })

    it('should not update a partially sent failed payment if the GateHub settlement fails', async () => {
      const paymentEvent = mockPaymentFailedEvent({
        data: {
          walletAddressId: walletAddress.id,
          sentAmount: {
            value: '500',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })
      gateHubClient.createTransaction.mockRejectedValue(
        new Error('GateHub transfer failed')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toThrow(
        'GateHub transfer failed'
      )

      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
    })

    it('should settle a partially sent failed payment regardless of its debit amount', async () => {
      const paymentEvent = mockPaymentFailedEvent({
        data: {
          id: 'payment-id',
          walletAddressId: walletAddress.id,
          debitAmount: {
            value: '0',
            assetCode: 'USD',
            assetScale: 2
          },
          sentAmount: {
            value: '500',
            assetCode: 'USD',
            assetScale: 2
          }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(gateHubClient.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5 }),
        'gatehub-user-id'
      )
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id' },
        { status: 'COMPLETED', value: 500n }
      )
    })

    it('should create the outgoing transaction and approve a payment', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })

      await service.onWebHook(paymentEvent)

      expect(rhyzaAdminClient.getPaymentIntentById).toHaveBeenCalledWith(
        'payment-intent-id'
      )
      expect(transactionService.createOutgoingTransaction).toHaveBeenCalledWith(
        paymentEvent.data,
        walletAddress,
        { walletAddresses: 'https://wallet.test/receiver' }
      )
      expect(rhyzaAdminClient.approvePayment).toHaveBeenCalledWith(
        'payment-intent-id',
        'payment-id'
      )
      expect(rhyzaAdminClient.cancelPayment).not.toHaveBeenCalled()
    })

    it('should cancel and fail a payment with insufficient funds', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      gateHubClient.getWalletBalance.mockResolvedValue([
        { vault: { asset_code: 'USD' }, available: '5' }
      ])

      await service.onWebHook(paymentEvent)

      expect(rhyzaAdminClient.cancelPayment).toHaveBeenCalledWith({
        paymentIntentId: 'payment-intent-id',
        id: 'payment-id',
        reason: 'Insufficient funds'
      })
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id' },
        { status: 'FAILED', value: 0n }
      )
      expect(rhyzaAdminClient.approvePayment).not.toHaveBeenCalled()
    })
  })
})
