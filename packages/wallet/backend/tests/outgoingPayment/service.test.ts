import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { mockedListAssets } from '@/tests/mocks'
import { faker } from '@faker-js/faker'
import { Account } from '@/account/model'
import { WalletAddress } from '@/walletAddress/model'
import { loginUser } from '@/tests/utils'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { BadRequest, NotFound } from '@shared/backend'

describe('OutgoingPayment Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let outgoingPaymentService: OutgoingPaymentService
  let userId: string

  const getQuote = jest.fn()
  const createPayment = jest.fn()

  const prepareWalletAddress = async (ownerId: string) => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId: ownerId,
      assetCode: mockedListAssets[0].code,
      assetScale: mockedListAssets[0].scale,
      gateHubWalletId: 'mocked'
    })

    return WalletAddress.query().insert({
      url: `https://ilp.test/${faker.string.alpha(10)}`,
      publicName: faker.string.alpha(10),
      accountId: account.id,
      id: faker.string.uuid()
    })
  }

  const completedQuote = (walletAddress: WalletAddress) => ({
    id: 'quote-1',
    paymentIntentId: 'pi-1',
    senderWalletAddress: walletAddress.url,
    senderWalletAddressId: walletAddress.id,
    state: 'COMPLETED',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    debitAmount: '1000',
    receiveAmount: '1000'
  })

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    outgoingPaymentService = await bindings.resolve('outgoingPaymentService')
    Reflect.set(outgoingPaymentService, 'rhyzaAdminClient', {
      getQuote,
      createPayment
    })
  })

  beforeEach(async (): Promise<void> => {
    const { user } = await loginUser({
      authService,
      extraUserArgs: { isEmailVerified: true, gateHubUserId: 'mocked' }
    })
    userId = user.id
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    jest.clearAllMocks()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  it('creates a Rhyza payment from the quote', async () => {
    const walletAddress = await prepareWalletAddress(userId)
    getQuote.mockResolvedValue(completedQuote(walletAddress))

    await outgoingPaymentService.createByQuoteId({
      userId,
      quoteId: 'quote-1',
      paymentIntentId: 'pi-1',
      description: 'rent'
    })

    expect(getQuote).toHaveBeenCalledWith('pi-1', 'quote-1')
    expect(createPayment).toHaveBeenCalledWith({
      walletAddress: walletAddress.url,
      paymentIntentId: 'pi-1',
      quoteId: 'quote-1',
      metadata: { description: 'rent' }
    })
  })

  it('rejects a quote that is not completed', async () => {
    const walletAddress = await prepareWalletAddress(userId)
    getQuote.mockResolvedValue({
      ...completedQuote(walletAddress),
      state: 'FAILED'
    })

    await expect(
      outgoingPaymentService.createByQuoteId({
        userId,
        quoteId: 'quote-1',
        paymentIntentId: 'pi-1'
      })
    ).rejects.toBeInstanceOf(BadRequest)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it('rejects an expired quote', async () => {
    const walletAddress = await prepareWalletAddress(userId)
    getQuote.mockResolvedValue({
      ...completedQuote(walletAddress),
      expiresAt: new Date(Date.now() - 1000).toISOString()
    })

    await expect(
      outgoingPaymentService.createByQuoteId({
        userId,
        quoteId: 'quote-1',
        paymentIntentId: 'pi-1'
      })
    ).rejects.toBeInstanceOf(BadRequest)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it('rejects a quote from a deactivated wallet address', async () => {
    const walletAddress = await prepareWalletAddress(userId)
    await WalletAddress.query().patchAndFetchById(walletAddress.id, {
      active: false
    })
    getQuote.mockResolvedValue(completedQuote(walletAddress))

    await expect(
      outgoingPaymentService.createByQuoteId({
        userId,
        quoteId: 'quote-1',
        paymentIntentId: 'pi-1'
      })
    ).rejects.toBeInstanceOf(BadRequest)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it("rejects a quote from another user's wallet address", async () => {
    const { user: otherUser } = await loginUser({
      authService,
      extraUserArgs: { isEmailVerified: true, gateHubUserId: 'mocked' }
    })
    const walletAddress = await prepareWalletAddress(otherUser.id)
    getQuote.mockResolvedValue(completedQuote(walletAddress))

    await expect(
      outgoingPaymentService.createByQuoteId({
        userId,
        quoteId: 'quote-1',
        paymentIntentId: 'pi-1'
      })
    ).rejects.toBeInstanceOf(NotFound)
    expect(createPayment).not.toHaveBeenCalled()
  })
})
