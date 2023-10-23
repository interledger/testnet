import { Container } from '@/shared/container'
import { Bindings } from '@/app'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { QuoteService } from '@/quote/service'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { mockedListAssets, mockRapyd } from '@/tests/mocks'
import { AccountService } from '@/account/service'
import { faker } from '@faker-js/faker'
import { Account } from '@/account/model'
import { PaymentPointer } from '@/paymentPointer/model'
import { loginUser, uuid } from '@/tests/utils'
import { truncateTables } from '@/tests/tables'

describe('Quote Service', () => {
  let bindings: Container<Bindings>
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
      assetId: mockedListAssets[0].id,
      assetScale: mockedListAssets[0].scale,
      virtualAccountId: 'mocked'
    })

    const paymentPointer = await PaymentPointer.query().insert({
      url: faker.string.alpha(10),
      publicName: faker.string.alpha(10),
      accountId: account.id,
      id: faker.string.uuid()
    })

    return {
      account,
      paymentPointer
    }
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    quoteService = await bindings.resolve('quoteService')
    accountService = await bindings.resolve('accountService')

    const accountServiceDepsMocked = {
      rafiki: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id),
        listAssets: () => mockedListAssets
      },
      ...mockRapyd
    }
    Reflect.set(accountService, 'deps', accountServiceDepsMocked)

    const quoteServiceDepsMocked = {
      accountService,
      rafikiClient: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id),

        createQuote: () => ({
          id: uuid(),
          receiver: `${faker.internet.url({
            appendSlash: true
          })}incoming-payments/${uuid()}`,
          receiveAmount: {
            assetCode: 'BRG',
            assetScale: 3,
            value: 100
          },
          debitAmount: {
            assetCode: 'BRG',
            assetScale: 3,
            value: 100
          },
          fee: {
            value: 100,
            assetCode: 'BRG',
            assetScale: 2
          }
        }),
        getRafikiAsset: (assetCode: unknown) =>
          mockedListAssets.find((asset) => asset.code === assetCode)
      },
      paymentPointerService: {
        getExternalPaymentPointer: () => ({
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
      incomingPaymentService: {
        createReceiver: () => faker.internet.url()
      }
    }

    Reflect.set(quoteService, 'deps', quoteServiceDepsMocked)
  })

  beforeEach(async (): Promise<void> => {
    const extraUserArgs = {
      isEmailVerified: true,
      rapydWalletId: 'mocked'
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
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Create Quote', () => {
    it('should create quote or quote with fee', async () => {
      const { paymentPointer } = await prepareQuoteDependencies()

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 100,
        paymentPointerId: paymentPointer.id,
        receiver:
          'https://rafiki-backend/work-acc/incoming-payments/d2697d29-ee3c-499f-bdbf-db49f57b1137',
        isReceive: true
      })

      expect(result).toMatchObject({
        debitAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: 100
        },
        receiveAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: 100
        }
      })
    })
  })

  describe('Create ExchangeQuote', () => {
    it('should create quote with fee', async () => {
      const { account } = await prepareQuoteDependencies()

      const result = await quoteService.createExchangeQuote({
        userId: userInfo.id,
        accountId: account.id,
        assetCode: 'BRG',
        amount: 100
      })

      expect(result).toMatchObject({
        debitAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: 100
        },
        receiveAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: 100
        },
        fee: {
          value: 100,
          assetCode: 'BRG',
          assetScale: 2
        }
      })
    })
  })
})
