import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { AwilixContainer } from 'awilix'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import {
  mockedListAssets,
  mockLogInRequest,
  mockWalletAddress
} from '@/tests/mocks'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createUser, errorHandler } from '@/tests/helpers'
import { truncateTables } from '@shared/backend/tests'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { WalletAddressController } from '@/walletAddress/controller'
import { WalletAddress } from '@/walletAddress/model'

describe('Wallet Address', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let walletAddressController: WalletAddressController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userId: string

  const next = jest.fn()
  const args = mockLogInRequest().body

  const prepareWADependencies = async () => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId,
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

  const createReqRes = async () => {
    res = createResponse()
    req = createRequest()

    await applyMiddleware(withSession, req, res)

    const { user, session } = await authService.authorize(args)
    req.session.id = session.id
    req.session.user = {
      id: user.id,
      email: user.email,
      needsWallet: !user.gateHubUserId,
      needsIDProof: !user.kycVerified,
      customerId: user.customerId
    }
    userId = user.id
    await User.query().patchAndFetchById(user.id, { gateHubUserId: 'mocked' })
  }

  const createMockWalletAddressControllerDeps = (isFailure?: boolean) => {
    const walletAddress = isFailure
      ? jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
      : () => mockWalletAddress
    const waControllerDepsMocked = {
      walletAddressService: {
        create: walletAddress,
        list: () => [mockWalletAddress],
        listAll: () => [mockWalletAddress],
        getExternalWalletAddress: walletAddress,
        getById: walletAddress,
        softDelete: jest.fn(),
        update: jest.fn()
      }
    }
    Reflect.set(
      walletAddressController,
      'walletAddressService',
      waControllerDepsMocked.walletAddressService
    )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    walletAddressController = await bindings.resolve('walletAddressController')

    createMockWalletAddressControllerDeps()
  })

  beforeEach(async (): Promise<void> => {
    await createUser({ ...args, isEmailVerified: true })
    await createReqRes()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    createMockWalletAddressControllerDeps()
  })

  describe('Create Wallet Address', () => {
    it('should return PaymentPointer', async () => {
      const { account } = await prepareWADependencies()
      req.params = {
        accountId: account.id
      }
      req.body = {
        walletAddressName: faker.lorem.slug(),
        publicName: faker.lorem.words({ min: 2, max: 2 })
      }
      await walletAddressController.create(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('result')
      expect(res._getJSONData()['result']).toHaveProperty('publicName')
    })

    it('should fail with status 500 on unexpected error', async () => {
      createMockWalletAddressControllerDeps(true)
      const { account } = await prepareWADependencies()
      req.params = {
        accountId: account.id
      }
      req.body = {
        walletAddressName: faker.lorem.slug(),
        publicName: faker.lorem.words({ min: 2, max: 2 })
      }
      await walletAddressController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })

  describe('Get List of Wallet Address', () => {
    it('should return array of Wallet Address', async () => {
      const { account } = await prepareWADependencies()
      req.params = {
        accountId: account.id
      }
      await walletAddressController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('result')
      const data = res._getJSONData().result
      expect(data).toHaveLength(1)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('url')
      expect(data[0]).toHaveProperty('publicName')
    })
  })

  describe('Get List All of Wallet Address', () => {
    it('should return array of Wallet Address', async () => {
      const { account } = await prepareWADependencies()
      req.params = {
        accountId: account.id
      }
      await walletAddressController.listAll(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('result')
      const data = res._getJSONData().result
      expect(data).toHaveLength(1)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('url')
      expect(data[0]).toHaveProperty('publicName')
    })
  })

  describe('Get External Wallet Address', () => {
    it('should return a Wallet Address', async () => {
      req.query = {
        url: faker.internet.url()
      }
      await walletAddressController.getExternalWalletAddress(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('result')
      const data = res._getJSONData().result
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('url')
      expect(data).toHaveProperty('publicName')
    })
  })

  describe('Get Wallet Address by ID', () => {
    it('should return a Wallet Address', async () => {
      const { account } = await prepareWADependencies()
      req.params = {
        accountId: account.id,
        id: faker.string.uuid()
      }
      await walletAddressController.getById(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('result')
      const data = res._getJSONData().result
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('url')
      expect(data).toHaveProperty('publicName')
    })
  })

  describe('Soft Delete Wallet Address', () => {
    it('should return confirmation message', async () => {
      req.params = {
        id: faker.string.uuid()
      }
      await walletAddressController.softDelete(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Wallet address was successfully deleted.'
      })
    })
  })

  describe('Update', () => {
    it('should return confirmation message', async () => {
      const { account, walletAddress } = await prepareWADependencies()
      req.params = {
        accountId: account.id,
        paymentPointerId: walletAddress.id
      }
      req.body = {
        publicName: faker.lorem.word()
      }
      await walletAddressController.update(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Wallet address was successfully updated.'
      })
    })
  })
})
