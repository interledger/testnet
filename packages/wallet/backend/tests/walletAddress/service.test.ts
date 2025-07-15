import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { AccountService } from '@/account/service'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { mockedListAssets } from '@/tests/mocks'
import { Cradle, createContainer } from '@/createContainer'
import { Env, env } from '@/config/env'
import { loginUser, uuid } from '@/tests/utils'
import { truncateTables } from '@shared/backend/tests'
import axios from 'axios'
import { WalletAddressService } from '@/walletAddress/service'
import { WalletAddress } from '@/walletAddress/model'
import { Logger } from 'winston'
import { AwilixContainer } from 'awilix'
import { NotFound } from '@shared/backend'

describe('Wallet Address Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let waService: WalletAddressService
  let accountService: AccountService
  let serviceEnv: Env
  let logger: Logger
  let userId: string

  const prepareWADependencies = async (
    paymentPointerName: string,
    isAccountAssigned = true
  ) => {
    let extraAcc = {} as Account
    if (!isAccountAssigned)
      extraAcc = await Account.query().insert({
        name: faker.string.alpha(10),
        userId,
        assetCode: mockedListAssets[0].code,
        assetId: mockedListAssets[0].id,
        assetScale: mockedListAssets[0].scale,
        gateHubWalletId: 'mocked'
      })

    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId,
      assetCode: mockedListAssets[0].code,
      assetId: mockedListAssets[0].id,
      assetScale: mockedListAssets[0].scale,
      gateHubWalletId: 'mocked'
    })

    const walletAddress = await WalletAddress.query().insert({
      url: `${serviceEnv.OPEN_PAYMENTS_HOST}/${paymentPointerName}`,
      publicName: faker.string.alpha(10),
      accountId: isAccountAssigned ? account.id : extraAcc.id,
      id: faker.string.uuid()
    })

    return {
      account,
      walletAddress
    }
  }

  function prepareWSDepsMock() {
    const waServiceDepsMocked = {
      accountService,
      env: serviceEnv,
      logger,
      cache: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
      },
      rafikiClient: {
        createRafikiWalletAddress: () => ({
          id: faker.string.uuid(),
          url: faker.internet.url()
        }),
        createRafikiWalletAddressKey: () => ({
          id: faker.string.uuid()
        }),
        revokeWalletAddressKey: jest.fn(),
        updateWalletAddress: jest.fn()
      },
      updateTransaction: jest.fn()
    }

    for (const key in waServiceDepsMocked)
      Reflect.set(
        waService,
        key,
        waServiceDepsMocked[key as keyof typeof waServiceDepsMocked]
      )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    waService = await bindings.resolve('walletAddressService')
    accountService = await bindings.resolve('accountService')
    serviceEnv = await bindings.resolve('env')
    logger = await bindings.resolve('logger')
    prepareWSDepsMock()
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
    userId = user.id
  })
  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })
  describe('Create Wallet Address', () => {
    it('should return an existed PaymentPointer', async () => {
      const { account } = await prepareWADependencies('my-wallet')
      const result = await waService.create({
        userId,
        accountId: account.id,
        walletAddressName: 'my-wallet',
        publicName: 'My Wallet'
      })
      expect(result).toHaveProperty('publicName')
      expect(result).toHaveProperty('accountId')
      expect(result).toHaveProperty('url')
      expect(result).toMatchObject({
        publicName: 'My Wallet',
        url: `${serviceEnv.OPEN_PAYMENTS_HOST}/my-wallet`
      })
    })

    it('should return an new WalletAddress', async () => {
      const { account } = await prepareWADependencies('my-work')
      const result = await waService.create({
        userId,
        accountId: account.id,
        walletAddressName: 'my-wallet',
        publicName: 'My Wallet'
      })
      expect(result).toHaveProperty('publicName')
      expect(result).toHaveProperty('accountId')
      expect(result).toHaveProperty('url')
      expect(result).toMatchObject({
        publicName: 'My Wallet'
      })
    })

    it('should return repetitive err', async () => {
      const { account } = await prepareWADependencies('my-work', false)

      await expect(
        waService.create({
          userId,
          accountId: account.id,
          walletAddressName: 'my-work',
          publicName: 'My Work'
        })
      ).rejects.toThrow(
        /This wallet address already exists. Please choose another name./
      )
    })
  })

  describe('List & listAll WalletAddress', () => {
    it('should return list of WalletAddress', async () => {
      const { account, walletAddress } =
        await prepareWADependencies('my-wallet')
      const result = await waService.list(userId, account.id)
      expect(result[0]).toMatchObject({
        url: walletAddress.url,
        accountId: account.id
      })
    })

    it('should return listAll of PaymentPointer', async () => {
      const { account, walletAddress } =
        await prepareWADependencies('my-wallet')
      const result = await waService.listAll(userId)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: walletAddress.url,
        accountId: account.id
      })
    })
  })

  describe('Get by Id', () => {
    it('should return a WalletAddress Object', async () => {
      const { account, walletAddress } =
        await prepareWADependencies('my-wallet')
      const result = await waService.getById({
        userId,
        accountId: account.id,
        walletAddressId: walletAddress.id
      })
      expect(result).toMatchObject({
        id: walletAddress.id,
        url: walletAddress.url,
        accountId: account.id
      })
    }, 50000)
  })

  describe('Get list of Identifiers By UserId', () => {
    it('should return array of users WalletAddress urls', async () => {
      await prepareWADependencies('my-wallet')
      const result = await waService.listIdentifiersByUserId(userId)
      const expected = [`${serviceEnv.OPEN_PAYMENTS_HOST}/my-wallet`]
      expect(result).toEqual(expect.arrayContaining(expected))
    })
  })

  describe('Is belong To User', () => {
    it('should return an boolean', async () => {
      const { walletAddress } = await prepareWADependencies('my-wallet')
      const result = await waService.belongsToUser(userId, walletAddress.url)
      expect(result).toBeTruthy()
    })
  })

  describe('Soft delete', () => {
    it('should return undefined', async () => {
      const { walletAddress } = await prepareWADependencies('my-wallet')
      const result = await waService.softDelete(userId, walletAddress.id)
      expect(result).toBeUndefined()
    })

    it('should reject NotFound', async () => {
      await expect(
        waService.softDelete(userId, faker.string.uuid())
      ).rejects.toThrowError(NotFound)
    })
  })

  describe('َUpdate', () => {
    it('should return undefined', async () => {
      const { account, walletAddress } =
        await prepareWADependencies('my-wallet')
      const result = await waService.update({
        userId: userId,
        accountId: account.id,
        walletAddressId: walletAddress.id,
        publicName: 'my-work'
      })
      expect(result).toBeUndefined()

      const foundPP = await waService.getById({
        userId,
        accountId: account.id,
        walletAddressId: walletAddress.id
      })

      expect(foundPP.publicName).toEqual('my-work')
    })
  })

  describe('Get External Wallet Address', () => {
    beforeAll(async (): Promise<void> => {
      axios.get = jest.fn().mockImplementation(() =>
        Promise.resolve({
          data: {
            url: `${serviceEnv.OPEN_PAYMENTS_HOST}/test`,
            publicName: 'Test Wallet',
            assetCode: 'USD',
            assetScale: 2
          }
        })
      )
    })

    it('should return a Wallet Address Object', async () => {
      const result = await waService.getExternalWalletAddress(
        `${serviceEnv.OPEN_PAYMENTS_HOST}/wallet`
      )
      expect(result).toMatchObject({
        url: `${serviceEnv.OPEN_PAYMENTS_HOST}/test`,
        publicName: 'Test Wallet',
        assetCode: 'USD',
        assetScale: 2
      })
    })
  })

  describe('FindBy Id Without Validation', () => {
    it('should return wallet address', async () => {
      const { account, walletAddress } =
        await prepareWADependencies('my-wallet')

      const result = await waService.findByIdWithoutValidation(walletAddress.id)
      expect(result).toMatchObject({
        url: `${serviceEnv.OPEN_PAYMENTS_HOST}/my-wallet`,
        accountId: account.id,
        id: walletAddress.id
      })
    })

    it('should return NotFound exception', async () => {
      await expect(
        waService.findByIdWithoutValidation(uuid())
      ).rejects.toThrowError(NotFound)
    })
  })
})
