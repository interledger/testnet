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
import { loginUser } from '@/tests/utils'
import { truncateTables } from '@shared/backend/tests'
import { BadRequest, NotFound } from '@shared/backend'
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

  const addLocalReceiver = async (
    url: string,
    { assetCode = 'BRG', active = true } = {}
  ) => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId: userInfo.id,
      assetCode,
      assetScale: 3,
      gateHubWalletId: 'mocked'
    })
    return WalletAddress.query().insert({
      url,
      publicName: faker.string.alpha(10),
      accountId: account.id,
      id: faker.string.uuid(),
      active
    })
  }

  const remoteIncomingPaymentUrl =
    'https://remote.test/incoming-payments/5b1a3c7e-2f4d-4e6a-8b9c-0d1e2f3a4b5c'
  const getPaymentDetailsByUrl = jest.fn()
  const createPaymentIntent = jest
    .fn()
    .mockResolvedValue({ id: 'pi-created', openPaymentsUrl: '' })
  const rhyzaCreateQuote = jest.fn().mockResolvedValue({
    state: 'COMPLETED',
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
        }),
        getPaymentDetailsByUrl
      },
      ratesService: {
        getRates: () => ({
          rates: {
            BRG: 100,
            EUR: 1
          }
        })
      },
      rhyzaAdminClient: {
        createQuote: rhyzaCreateQuote,
        createPaymentIntent
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
    jest.clearAllMocks()
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
        id: 'quote-1',
        paymentIntentId: 'pi-1',
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

    it('creates a payment intent and quotes it by ID for local wallet address receivers', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/bob'
      await addLocalReceiver(receiver)

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

    it('rejects wallet addresses at other providers', async () => {
      const { walletAddress } = await prepareQuoteDependencies()

      await expect(
        quoteService.create({
          userId: userInfo.id,
          amount: 1,
          walletAddressId: walletAddress.id,
          receiver: 'https://remote.test/carol',
          isReceive: true
        })
      ).rejects.toBeInstanceOf(BadRequest)
      expect(createPaymentIntent).not.toHaveBeenCalled()
      expect(rhyzaCreateQuote).not.toHaveBeenCalled()
    })

    it('finds local receivers entered as ilp.dev addresses', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const stored = await addLocalReceiver(`${env.OPEN_PAYMENTS_HOST}/gina`)

      await quoteService.create({
        userId: userInfo.id,
        amount: 1,
        walletAddressId: walletAddress.id,
        receiver: 'https://ilp.dev/gina',
        isReceive: false
      })

      expect(createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ walletAddress: stored.url })
      )
    })

    it('rejects amounts too large to quote', async () => {
      const { walletAddress } = await prepareQuoteDependencies()

      await expect(
        quoteService.create({
          userId: userInfo.id,
          amount: 1e19,
          walletAddressId: walletAddress.id,
          receiver: remoteIncomingPaymentUrl,
          isReceive: false
        })
      ).rejects.toBeInstanceOf(BadRequest)
    })

    it('rejects inactive local receivers', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/erin'
      await addLocalReceiver(receiver, { active: false })

      await expect(
        quoteService.create({
          userId: userInfo.id,
          amount: 1,
          walletAddressId: walletAddress.id,
          receiver,
          isReceive: true
        })
      ).rejects.toBeInstanceOf(BadRequest)
      expect(createPaymentIntent).not.toHaveBeenCalled()
    })

    it.each(['FAILED', 'PENDING'])(
      'throws BadRequest when the Rhyza quote is %s',
      async (state) => {
        const { walletAddress } = await prepareQuoteDependencies()
        rhyzaCreateQuote.mockResolvedValueOnce({
          state,
          id: 'quote-1',
          paymentIntentId: 'pi-1'
        })

        await expect(
          quoteService.create({
            userId: userInfo.id,
            amount: 1,
            walletAddressId: walletAddress.id,
            receiver: remoteIncomingPaymentUrl,
            isReceive: false
          })
        ).rejects.toBeInstanceOf(BadRequest)
      }
    )

    it('reports a zero fee when the converted receive amount exceeds the debit', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/frank'
      await addLocalReceiver(receiver, { assetCode: 'EUR' })
      rhyzaCreateQuote.mockResolvedValueOnce({
        state: 'COMPLETED',
        id: 'quote-1',
        paymentIntentId: 'pi-1',
        debitAmount: '100',
        receiveAmount: '110',
        exchangeRate: 1
      })

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 0.1,
        walletAddressId: walletAddress.id,
        receiver,
        isReceive: false
      })

      expect(result.fee?.value).toBe('0')
    })

    it('rounds the converted receive amount instead of truncating float error', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/hank'
      await addLocalReceiver(receiver, { assetCode: 'EUR' })
      rhyzaCreateQuote.mockResolvedValueOnce({
        state: 'COMPLETED',
        id: 'quote-1',
        paymentIntentId: 'pi-1',
        debitAmount: '110',
        receiveAmount: '110',
        exchangeRate: 1.1
      })

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 0.11,
        walletAddressId: walletAddress.id,
        receiver,
        isReceive: false
      })

      // 110 / 1.1 = 99.999…, which must count as 100 (fee 10), not 99 (fee 11).
      expect(result.fee?.value).toBe('10')
    })

    it.each([
      { remaining: 0.995, expected: '995' },
      { remaining: 500, expected: '1000' },
      { remaining: -2, expected: '1000' },
      { remaining: 0.0001, expected: '1000' }
    ])(
      'adjusts to the payment request amount only within 1% (remaining $remaining)',
      async ({ remaining, expected }) => {
        const { walletAddress } = await prepareQuoteDependencies()
        Reflect.set(quoteService, 'incomingPaymentService', {
          getExternalPayment: () => ({
            receivedAmount: { assetCode: 'EUR', assetScale: 3, value: '0' }
          }),
          getPaymentDetailsByUrl: jest
            .fn()
            .mockResolvedValue({ value: remaining, assetCode: 'EUR' })
        })

        try {
          await quoteService.create({
            userId: userInfo.id,
            amount: 1,
            walletAddressId: walletAddress.id,
            receiver: remoteIncomingPaymentUrl,
            isReceive: true
          })

          expect(rhyzaCreateQuote).toHaveBeenCalledWith(
            expect.objectContaining({ receiveAmount: expected })
          )
        } finally {
          Reflect.set(quoteService, 'incomingPaymentService', {
            getExternalPayment: () => ({
              receivedAmount: { assetCode: 'BRG', assetScale: 3, value: '0' }
            }),
            getPaymentDetailsByUrl
          })
        }
      }
    )

    it('computes the fee from the Rhyza exchange rate for fixed-receive quotes too', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/ivan'
      await addLocalReceiver(receiver, { assetCode: 'EUR' })
      rhyzaCreateQuote.mockResolvedValueOnce({
        state: 'COMPLETED',
        id: 'quote-1',
        paymentIntentId: 'pi-1',
        debitAmount: '1010',
        receiveAmount: '2000',
        exchangeRate: 2
      })

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 1,
        walletAddressId: walletAddress.id,
        receiver,
        isReceive: true
      })

      expect(result.fee?.value).toBe('10')
    })

    it('rejects quotes whose debit exceeds the balance', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      rhyzaCreateQuote.mockResolvedValueOnce({
        state: 'COMPLETED',
        id: 'quote-1',
        paymentIntentId: 'pi-1',
        debitAmount: '100001',
        receiveAmount: '1000'
      })

      await expect(
        quoteService.create({
          userId: userInfo.id,
          amount: 1,
          walletAddressId: walletAddress.id,
          receiver: remoteIncomingPaymentUrl,
          isReceive: true
        })
      ).rejects.toThrow('Not enough funds in account')
    })

    it('computes the cross-currency fee from the Rhyza exchange rate', async () => {
      const { walletAddress } = await prepareQuoteDependencies()
      const receiver = 'https://ilp.test/dave'
      await addLocalReceiver(receiver, { assetCode: 'EUR' })
      rhyzaCreateQuote.mockResolvedValueOnce({
        state: 'COMPLETED',
        id: 'quote-1',
        paymentIntentId: 'pi-1',
        debitAmount: '1000',
        receiveAmount: '1980',
        exchangeRate: 2
      })

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 1,
        walletAddressId: walletAddress.id,
        receiver,
        isReceive: false
      })

      expect(result.fee).toEqual({
        value: '10',
        assetCode: 'BRG',
        assetScale: 3
      })
    })

    it.each([new NotFound(), new Error('Rhyza is down')])(
      'skips the optional amount adjustment when the lookup fails (%s)',
      async (error) => {
        const { walletAddress } = await prepareQuoteDependencies()
        const receiveExternalPayment = jest.fn().mockReturnValue({
          receivedAmount: { assetCode: 'EUR', assetScale: 3, value: '0' }
        })
        Reflect.set(quoteService, 'incomingPaymentService', {
          getExternalPayment: receiveExternalPayment,
          getPaymentDetailsByUrl: jest.fn().mockRejectedValue(error)
        })

        try {
          await expect(
            quoteService.create({
              userId: userInfo.id,
              amount: 1,
              walletAddressId: walletAddress.id,
              receiver: remoteIncomingPaymentUrl,
              isReceive: true
            })
          ).resolves.toBeDefined()
        } finally {
          Reflect.set(quoteService, 'incomingPaymentService', {
            getExternalPayment: () => ({
              receivedAmount: { assetCode: 'BRG', assetScale: 3, value: '0' }
            }),
            getPaymentDetailsByUrl
          })
        }
      }
    )
  })
})
