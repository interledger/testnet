import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import type { AuthService } from '@/auth/service'
import { faker } from '@faker-js/faker'
import { AwilixContainer } from 'awilix'
import { GateHubService } from '@/gatehub/service'
import { loginUser } from '../utils'
import { User } from '@/user/model'
import { ICardTransactionWebhookData, IWebhookData } from '@/gatehub/types'
import { GateHubClient } from '@/gatehub/client'
import { EmailService } from '@/email/service'
import { Account } from '@/account/model'
import { WalletAddress } from '@/walletAddress/model'
import { Transaction } from '@/transaction/model'
import { mockedListAssets } from '../mocks'

describe('GateHub Service', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let gateHubService: GateHubService
  let user: User

  const mockAccountService = {
    createDefaultAccount: jest.fn()
  }

  const mockWalletAddressService = {
    create: jest.fn()
  }

  const mockEmailService = {
    sendKYCVerifiedEmail: jest.fn(),
    sendActionRequiredEmail: jest.fn(),
    sendUserRejectedEmail: jest.fn()
  }

  const mockGateHubClient = {
    getIframeUrl: jest.fn(),
    handleWebhook: jest.fn(),
    addUserToGateway: jest.fn(),
    createManagedUser: jest.fn(),
    createWallet: jest.fn(),
    connectUserToGateway: jest.fn(),
    getWalletBalance: jest.fn(),
    getUserState: jest.fn(),
    isProduction: false,
    getManagedUsers: jest.fn(),
    getCardsByCustomer: jest.fn(),
    createCustomer: jest.fn()
  }

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }

  const createMockWebhookData = (
    mockData?: Partial<IWebhookData>
  ): IWebhookData => ({
    uuid: faker.string.uuid(),
    timestamp: Date.now().toString(),
    user_uuid: mockData?.user_uuid ?? 'mocked',
    environment: 'sandbox',
    event_type: mockData?.event_type ?? 'id.verification.accepted',
    data: mockData?.data ?? {}
  })

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    gateHubService = await bindings.resolve('gateHubService')
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    jest.resetAllMocks()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  beforeEach(async (): Promise<void> => {
    const extraUserArgs = {
      isEmailVerified: true,
      gateHubUserId: 'mocked',
      firstName: 'John',
      lastName: 'Doe'
    }

    const resp = await loginUser({
      authService,
      extraUserArgs
    })
    user = resp.user

    Reflect.set(
      gateHubService,
      'gateHubClient',
      mockGateHubClient as unknown as GateHubClient
    )
    Reflect.set(
      gateHubService,
      'emailService',
      mockEmailService as unknown as EmailService
    )
    Reflect.set(gateHubService, 'accountService', mockAccountService)
    Reflect.set(
      gateHubService,
      'walletAddressService',
      mockWalletAddressService
    )
    Reflect.set(gateHubService, 'logger', mockLogger)

    mockAccountService.createDefaultAccount.mockReturnValue({
      id: faker.string.uuid(),
      userId: user.id,
      assetCode: 'EUR',
      name: 'EUR Account',
      gateHubWalletId: faker.string.uuid()
    })

    mockWalletAddressService.create.mockReturnValue({
      id: faker.string.uuid(),
      accountId: faker.string.uuid(),
      userId: user.id,
      url: 'test-wallet',
      isCard: false
    })

    mockGateHubClient.getUserState.mockReturnValue({
      profile: {
        last_name: user.lastName,
        first_name: user.firstName,
        address_country_code: 'US',
        address_city: 'Rehoboth'
      }
    })
  })

  describe('Get Iframe Url', () => {
    it('should return Iframe Url ', async () => {
      const mockedIframeUrl = 'URL'
      mockGateHubClient.getIframeUrl.mockReturnValue(mockedIframeUrl)

      const result = await gateHubService.getIframeUrl('withdrawal', user.id)
      expect(result).toMatchObject({ url: mockedIframeUrl })
    })

    it('should return NotFound if no user found', async () => {
      await expect(
        gateHubService.getIframeUrl('withdrawal', faker.string.uuid())
      ).rejects.toThrowError(/Not Found/)
    })
    it('should return NotFound if gateHubUserId not found', async () => {
      await User.query().findById(user.id).patch({
        gateHubUserId: ''
      })
      await expect(
        gateHubService.getIframeUrl('withdrawal', user.id)
      ).rejects.toThrowError(/Not Found/)
    })
  })

  describe('handle Webhook', () => {
    describe('KYC Verification Events', () => {
      it('should mark User As Verified and send email in production', async () => {
        mockGateHubClient.isProduction = true
        await gateHubService.handleWebhook(createMockWebhookData())

        const userData = await User.query().findById(user.id)
        expect(userData?.kycVerified).toBe(true)
        expect(mockEmailService.sendKYCVerifiedEmail).toHaveBeenCalledWith(
          user.email
        )
      })

      it('should handle already verified users properly', async () => {
        await User.query().findById(user.id).patch({
          kycVerified: true,
          lastName: 'Existing'
        })
        await gateHubService.handleWebhook(createMockWebhookData())

        const updatedUser = await User.query().findById(user.id)
        expect(updatedUser?.kycVerified).toBe(true)
        expect(mockGateHubClient.connectUserToGateway).not.toHaveBeenCalled()
      })

      it('should handle action_required webhook and send email', async () => {
        await gateHubService.handleWebhook(
          createMockWebhookData({
            event_type: 'id.verification.action_required',
            data: { message: 'additional documents needed' }
          })
        )

        const userData = await User.query().findById(user.id)
        expect(userData?.kycVerified).toBe(false)
        expect(mockEmailService.sendActionRequiredEmail).toHaveBeenCalledWith(
          user.email,
          'additional documents needed'
        )
      })

      it('sending a different verification event should not mark User As Verified', async () => {
        await gateHubService.handleWebhook(
          createMockWebhookData({ event_type: 'id.verification.rejected' })
        )
        const userData = await User.query().findById(user.id)
        expect(userData?.kycVerified).toBe(false)
      })

      it('sending a wrong gateHubUserId will throw a User Not found exception', async () => {
        await expect(
          gateHubService.handleWebhook(
            createMockWebhookData({ user_uuid: faker.string.uuid() })
          )
        ).rejects.toThrowError(/User not found/)
        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should handle document notice warnings', async () => {
        await gateHubService.handleWebhook(
          createMockWebhookData({ event_type: 'id.document_notice.warning' })
        )

        const userData = await User.query().findById(user.id)
        expect(userData?.isDocumentUpdateRequired).toBe(true)
      })
    })

    describe('Card Transaction Events', () => {
      let account: Account
      let walletAddress: WalletAddress
      const createMockCardData = (
        amount = '10.50'
      ): ICardTransactionWebhookData => ({
        authorizationData: {
          transactionId: 'tx-123',
          billingCurrency: 'EUR',
          billingAmount: amount,
          id: 0,
          ghResponseCode: '',
          cardScheme: 0,
          type: 0,
          createdAt: '',
          txStatus: '',
          vaultId: 0,
          cardId: 0,
          refTransactionId: '',
          responseCode: null,
          transactionAmount: '',
          transactionCurrency: '',
          terminalId: null,
          wallet: 0,
          transactionDateTime: '',
          processDateTime: null
        }
      })

      beforeEach(async () => {
        account = await Account.query().insert({
          name: faker.string.alpha(10),
          userId: user.id,
          assetCode: mockedListAssets[2].code,
          assetId: mockedListAssets[2].id,
          assetScale: mockedListAssets[2].scale,
          gateHubWalletId: 'mocked'
        })

        walletAddress = await WalletAddress.query().insert({
          accountId: account.id,
          id: faker.string.uuid(),
          url: 'test-wallet',
          isCard: true,
          publicName: 'Test Wallet'
        })
      })

      it('should process card transaction successfully', async () => {
        // set card wallet address
        await User.query().findById(user.id).patch({
          cardWalletAddress: walletAddress.url
        })

        await gateHubService.handleWebhook(
          createMockWebhookData({
            event_type: 'cards.transaction.authorization',
            data: createMockCardData()
          })
        )

        const transaction = await Transaction.query().first()
        expect(transaction).toBeTruthy()
        expect(transaction?.walletAddressId).toBe(walletAddress.id)
        expect(transaction?.accountId).toBe(account.id)
        expect(transaction?.paymentId).toBe('tx-123')
        expect(transaction?.value).toBe(BigInt(1050))
      })

      it('should handle missing card wallet address record', async () => {
        await User.query().findById(user.id).patch({
          cardWalletAddress: undefined
        })

        await gateHubService.handleWebhook(
          createMockWebhookData({
            event_type: 'cards.transaction.authorization',
            data: createMockCardData()
          })
        )

        const transaction = await Transaction.query().first()
        expect(transaction).toBeFalsy()
        expect(mockLogger.warn).toHaveBeenCalled()
      })
    })
  })

  describe('addUserToGateway', () => {
    describe('Staging Environment', () => {
      it('should set user as KYC verified', async () => {
        const mockedConnectUserToGatewayResponse = true
        mockGateHubClient.connectUserToGateway.mockReturnValue(
          mockedConnectUserToGatewayResponse
        )
        const result = await gateHubService.addUserToGateway(user.id)
        expect(result.isApproved).toBe(mockedConnectUserToGatewayResponse)

        const userData = await User.query().findById(user.id)
        expect(userData?.kycVerified).toBe(true)
      })

      it('should not set user as KYC verified when user not connected to gateway', async () => {
        const mockedConnectUserToGatewayResponse = false
        mockGateHubClient.connectUserToGateway.mockReturnValue(
          mockedConnectUserToGatewayResponse
        )
        const result = await gateHubService.addUserToGateway(user.id)

        expect(result.isApproved).toBe(mockedConnectUserToGatewayResponse)

        const userData = await User.query().findById(user.id)
        expect(userData?.kycVerified).toBe(false)
      })

      it('should return Not Found if user not found', async () => {
        await expect(
          gateHubService.addUserToGateway(faker.string.uuid())
        ).rejects.toThrowError(/Not Found/)
      })

      it('should return Not Found if user has no gateHubUserId field set', async () => {
        await User.query().findById(user.id).patch({
          gateHubUserId: ''
        })
        await expect(
          gateHubService.addUserToGateway(user.id)
        ).rejects.toThrowError(/Not Found/)
      })
    })

    describe('Sandbox Environment', () => {
      beforeEach(() => {
        env.NODE_ENV = 'development'
        env.GATEHUB_ENV = 'sandbox'
      })

      it('should setupSandboxCustomer successfully', async () => {
        const mockedCustomer = {
          customers: {
            id: 'cust-123',
            accounts: [
              {
                cards: [
                  {
                    id: 'card-123'
                  }
                ]
              }
            ]
          }
        }

        mockGateHubClient.createCustomer.mockResolvedValue(mockedCustomer)
        const result = await gateHubService.addUserToGateway(user.id)

        expect(result.customerId).toBe(mockedCustomer.customers.id)
      })
    })

    describe('Production Environment', () => {
      beforeEach(() => {
        env.NODE_ENV = 'production'
        env.GATEHUB_ENV = 'production'
      })

      it('should setupProductionCustomer successfully', async () => {
        const mockedManagedUsers = [
          {
            id: user.gateHubUserId,
            email: user.email,
            meta: {
              meta: {
                customerId: 'cust-123',
                paymentPointer: '$ilp.dev/test-wallet'
              }
            }
          }
        ]
        const mockedCards = [
          {
            id: 'card-123',
            status: 'Active'
          }
        ]

        mockGateHubClient.getManagedUsers.mockResolvedValue(mockedManagedUsers)
        mockGateHubClient.getCardsByCustomer.mockResolvedValue(mockedCards)
        const result = await gateHubService.addUserToGateway(user.id)

        expect(result.customerId).toBe('cust-123')

        const updatedUser = await User.query().findById(user.id)
        expect(updatedUser?.customerId).toBe('cust-123')
        expect(updatedUser?.cardWalletAddress).toBe('$ilp.dev/test-wallet')
      })

      it('should return undefined if the GateHub user with the specified email is not found', async () => {
        mockGateHubClient.getManagedUsers.mockResolvedValue([
          { email: 'user1@example.com' },
          { email: 'user2@example.com' }
        ])

        const result = await gateHubService.addUserToGateway(user.id)
        expect(result).toEqual({
          customerId: undefined,
          isApproved: undefined
        })
      })
    })
  })
})
