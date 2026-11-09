import { EventType, RhyzaService } from '@/rhyza/service'
import type { WebhookType } from '@/rhyza/validation'
import type { TransactionService } from '@/transaction/service'
import type { WalletAddressService } from '@/walletAddress/service'
import type { Logger } from 'winston'
import type { GateHubClient } from '@/gatehub/client'
import type { AccountService } from '@/account/service'
import type { SocketService } from '@/socket/service'
import type { Env } from '@/config/env'
import type { RhyzaAdminClient } from '@/rhyza/admin-client'
import MessageType from '@/socket/messageType'
import { BadRequest, Conflict } from '@shared/backend'
import { RhyzaServerError } from '@/rhyza/http-client'
import {
  mockPaymentCompletedEvent,
  mockPaymentCreatedEvent,
  mockPaymentFailedEvent,
  mockPaymentIntentCompletedEvent,
  mockPaymentIntentCreatedEvent
} from '../mocks'

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
    let accountService: { getGateHubWalletAddress: jest.Mock }
    let rhyzaAdminClient: {
      listPayments: jest.Mock
      cancelPayment: jest.Mock
      getPaymentIntentById: jest.Mock
      approvePayment: jest.Mock
    }
    let logger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock }

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

      logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
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
      ).toHaveBeenCalledWith(walletAddress.id)
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

    it('should mark a failed payment without a sent amount as failed', async () => {
      const paymentEvent = mockPaymentFailedEvent({
        data: { id: 'payment-id' }
      })

      await service.onWebHook(paymentEvent)

      expect(transactionService.updateTransaction).toHaveBeenCalledTimes(1)
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id', status: 'PENDING' },
        { status: 'FAILED', value: 0n }
      )
      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(socketService.emitMoneySentByUserId).not.toHaveBeenCalled()
    })

    it('should mark a failed payment with a zero sent amount as failed', async () => {
      const paymentEvent = mockPaymentFailedEvent({
        data: {
          id: 'payment-id',
          walletAddressId: walletAddress.id,
          sentAmount: { value: '0', assetCode: 'USD', assetScale: 2 }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id', status: 'PENDING' },
        { status: 'FAILED', value: 0n }
      )
      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
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
        { paymentId: 'payment-id', status: 'PENDING' },
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
        { paymentId: 'payment-id', status: 'PENDING' },
        { status: 'FAILED', value: 0n }
      )
      expect(rhyzaAdminClient.approvePayment).not.toHaveBeenCalled()
    })

    it('should cancel a payment with a zero amount', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id,
          debitAmount: { value: '0', assetCode: 'USD', assetScale: 2 }
        }
      })

      await service.onWebHook(paymentEvent)

      expect(rhyzaAdminClient.cancelPayment).toHaveBeenCalledWith({
        paymentIntentId: 'payment-intent-id',
        id: 'payment-id',
        reason: 'Invalid amount'
      })
      expect(rhyzaAdminClient.approvePayment).not.toHaveBeenCalled()
    })

    it('should cancel and fail a payment that Rhyza rejects on approval', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      rhyzaAdminClient.approvePayment.mockRejectedValue(
        new Conflict('Payment intent is in an invalid state')
      )

      await service.onWebHook(paymentEvent)

      expect(rhyzaAdminClient.cancelPayment).toHaveBeenCalledWith({
        paymentIntentId: 'payment-intent-id',
        id: 'payment-id',
        reason: 'Payment could not be processed'
      })
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        { paymentId: 'payment-id', status: 'PENDING' },
        { status: 'FAILED', value: 0n }
      )
    })

    it('should cancel a payment from a wallet without a GateHub account', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      accountService.getGateHubWalletAddress.mockRejectedValue(
        new BadRequest('No account associated to the provided wallet address')
      )

      await service.onWebHook(paymentEvent)

      expect(rhyzaAdminClient.cancelPayment).toHaveBeenCalledWith({
        paymentIntentId: 'payment-intent-id',
        id: 'payment-id',
        reason: 'Payment could not be processed'
      })
      expect(rhyzaAdminClient.approvePayment).not.toHaveBeenCalled()
    })

    it('should rethrow when a rejected payment cannot be cancelled', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      rhyzaAdminClient.approvePayment.mockRejectedValue(
        new Conflict('Payment is already complete')
      )
      rhyzaAdminClient.cancelPayment.mockRejectedValue(
        new Conflict('Payment is already complete')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toBeInstanceOf(
        Conflict
      )
      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
    })

    it('should rethrow without cancelling when Rhyza fails with a server error', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      rhyzaAdminClient.approvePayment.mockRejectedValue(
        new RhyzaServerError(503, 'Service Unavailable')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toBeInstanceOf(
        RhyzaServerError
      )
      expect(rhyzaAdminClient.cancelPayment).not.toHaveBeenCalled()
    })

    it('should rethrow without cancelling when approval fails temporarily', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      rhyzaAdminClient.approvePayment.mockRejectedValue(
        new Error('Rhyza POST /approve timed out')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toThrow('timed out')
      expect(rhyzaAdminClient.cancelPayment).not.toHaveBeenCalled()
      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
    })

    it('should rethrow without cancelling when the GateHub lookup fails', async () => {
      const paymentEvent = mockPaymentCreatedEvent({
        data: {
          id: 'payment-id',
          paymentIntentId: 'payment-intent-id',
          walletAddressId: walletAddress.id
        }
      })
      accountService.getGateHubWalletAddress.mockRejectedValue(
        new Error('GateHub unavailable')
      )

      await expect(service.onWebHook(paymentEvent)).rejects.toThrow(
        'GateHub unavailable'
      )
      expect(rhyzaAdminClient.cancelPayment).not.toHaveBeenCalled()
      expect(rhyzaAdminClient.approvePayment).not.toHaveBeenCalled()
    })

    it('should log when grant revoked webhook is received', async () => {
      const grantRevokedEvent = {
        id: 'grant-revoked-id',
        type: EventType.GrantRevoked,
        data: {
          createdAt: new Date().toISOString(),
          id: 'grant-id',
          status: 'PROCESSING',
          access: [
            {
              type: 'INCOMING_PAYMENT',
              actions: ['CREATE'],
              identifier: 'receiver',
              limits: {
                receiver: 'receiver',
                assetCode: 'USD',
                assetScale: 2,
                receiveAmount: '1000'
              }
            }
          ],
          client: 'client-id',
          clientName: 'Client',
          subjectIds: [{ id: 'subject-id', format: 'url' }]
        }
      } satisfies WebhookType

      await service.onWebHook(grantRevokedEvent)

      expect(logger.info).toHaveBeenCalledWith(
        `Grant revoked webhook received with id ${grantRevokedEvent.id}, grant id ${grantRevokedEvent.data.id} and status ${grantRevokedEvent.data.status}`
      )
      expect(
        transactionService.createIncomingTransaction
      ).not.toHaveBeenCalled()
      expect(transactionService.updateTransaction).not.toHaveBeenCalled()
      expect(gateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(rhyzaAdminClient.listPayments).not.toHaveBeenCalled()
      expect(socketService.emitMoneyReceivedByUserId).not.toHaveBeenCalled()
      expect(socketService.emitMoneySentByUserId).not.toHaveBeenCalled()
    })
  })
})
