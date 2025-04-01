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
      assetId: mockedListAssets[0].id,
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

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    quoteService = await bindings.resolve('quoteService')
    accountService = await bindings.resolve('accountService')

    const accountServiceDepsMocked = {
      rafikiClient: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id),
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
      incomingPaymentService: {
        createReceiver: () => faker.internet.url(),
        getExternalPayment: () => ({
          receivedAmount: {
            assetCode: 'BRG',
            assetScale: 3,
            value: 0
          }
        })
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
  })

  describe('Create Quote', () => {
    // TODO: fix after GateHub balance is implemented
    it.skip('should create quote or quote with fee', async () => {
      const { walletAddress } = await prepareQuoteDependencies()

      const result = await quoteService.create({
        userId: userInfo.id,
        amount: 100,
        walletAddressId: walletAddress.id,
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
})
