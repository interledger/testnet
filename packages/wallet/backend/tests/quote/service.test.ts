import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { QuoteService } from '@/quote/service'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { mockedListAssets, mockGateHubClient } from '@/tests/mocks'
import { AccountService } from '@/account/service'
import { faker } from '@faker-js/faker'
import { Account } from '@/account/model'
import { WalletAddress } from '@/walletAddress/model'
import { loginUser, uuid } from '@/tests/utils'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'

describe('Quote Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let quoteService: QuoteService
  let accountService: AccountService
  let userInfo: { id: string; email: string }

  const prepareQuoteDependencies = async () => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId: userInfo.id,
      assetCode: mockedListAssets[0].code,
      assetScale: mockedListAssets[0].scale,
      gateHubWalletId: 'mocked'
    })

    const walletAddress = await WalletAddress.query().insert({
      url: faker.string.alpha(10),
      publicName: faker.string.alpha(10),
      accountId: account.id,
      id: faker.string.uuid()
    })

    return {
      account,
      walletAddress
    }
  }

  const rhyzaCreateQuote = jest.fn().mockResolvedValue({
    id: 'quote-1',
    paymentIntentId: 'pi-1',
    senderWalletAddress: 'https://ilp.test/alice',
    senderWalletAddressId: 'wa-1',
    expiresAt: '2026-10-28T12:00:00.000Z',
    debitAmount: '1000',
    receiveAmount: '1000',
    exchangeRate: 1
  })

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    quoteService = await bindings.resolve('quoteService')
    accountService = await bindings.resolve('accountService')

    const accountServiceDepsMocked = {
      rafikiClient: {
        getRafikiAssets: (code: unknown) =>
          mockedListAssets.find((asset) => asset.code === code),
        listAssets: () => mockedListAssets
      },
      gateHubClient: mockGateHubClient
    }
    Reflect.set(
      accountService,
      'rafikiClient',
      accountServiceDepsMocked.rafikiClient
    )

    const quoteServiceDepsMocked = {
      accountService: {
        findAccountById: () => ({
          assetCode: 'BRG',
          assetScale: 3
        }),
        getAccountById: () => ({ balance: 100000 })
      },
      incomingPaymentService: {
        getExternalPayment: () => ({
          receivedAmount: { assetCode: 'BRG', assetScale: 3, value: '0' }
        })
      },
      walletAddressService: {
        getExternalWalletAddress: () => ({
          assetCode: 'BRG',
          assetScale: 3
        }),
        create: () => ({
          id: uuid(),
          url: faker.internet.url()
        })
      },
      ratesService: {
        getRates: () => ({
          rates: {
            BRG: 100
          }
        })
      },
      rhyzaAdminClient: {
        createQuote: rhyzaCreateQuote,
        createPaymentIntent: jest
          .fn()
          .mockResolvedValue({ id: 'pi-created', openPaymentsUrl: '' })
      }
    }

    for (const key in quoteServiceDepsMocked)
      Reflect.set(
        quoteService,
        key,
        quoteServiceDepsMocked[key as keyof typeof quoteServiceDepsMocked]
      )
  })

  beforeEach(async (): Promise<void> => {
    const extraUserArgs = {
      isEmailVerified: true,
      gateHubUserId: 'mocked'
    }

    const { user } = await loginUser({
      authService,
      extraUserArgs
    })
    userInfo = {
      id: user.id,
      email: user.email
    }
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    rhyzaCreateQuote.mockClear()
  })

  describe('Create Quote', () => {
    it('creates a quote from a payment intent URL', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver =
        'https://rafiki-backend/work-acc/incoming-payments/d2697d29-ee3c-499f-bdbf-db49f57b1137'

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 1,
        walletAddressId: walletAddress.id,
        receiver,
        isReceive: true
      })

      expect(rhyzaCreateQuote).toHaveBeenCalledWith({
        id: expect.any(String),
        walletAddress: walletAddress.url,
        receiveAmount: '1000',
        paymentIntentUrl: receiver
      })
      expect(result).toMatchObject({
        debitAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: '1000'
        },
        receiveAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: '1000'
        }
      })
    })

    it('creates a payment intent and quotes it by ID for wallet address receivers', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/bob'

      await quoteService.create({
        userId: userInfo.id,
        amount: 1,
        walletAddressId: walletAddress.id,
        receiver,
        isReceive: false
      })

      expect(rhyzaCreateQuote).toHaveBeenCalledWith({
        id: expect.any(String),
        walletAddress: walletAddress.url,
        debitAmount: '1000',
        paymentIntentId: 'pi-created'
      })
    })
  })
})
