import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { RapydController } from '@/rapyd/controller'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import { applyMiddleware, uuid } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { faker } from '@faker-js/faker'
import { AccountService } from '@/account/service'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import {
  mockCreateWalletRequest,
  mockedListAssets,
  mockedRapydFailureService,
  mockedRapydService,
  mockLogInRequest,
  mockRapyd,
  mockVerifyIdentityRequest
} from '@/tests/mocks'
import { createUser } from '@/tests/helpers'
import { truncateTables } from '@/tests/tables'
import { WalletAddressService } from '@/walletAddress/service'
import { errorHandler } from '@/middleware/errorHandler'
import { AwilixContainer } from 'awilix'

describe('Rapyd Controller', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let rapydController: RapydController
  let accountService: AccountService
  let walletAddressService: WalletAddressService
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userId: string

  const next = jest.fn()
  const args = mockLogInRequest().body

  const createReqRes = async () => {
    res = createResponse()
    req = createRequest()

    await applyMiddleware(withSession, req, res)

    const { user, session } = await authService.authorize(args)
    req.session.id = session.id
    req.session.user = {
      id: user.id,
      email: user.email,
      needsWallet: !user.rapydWalletId,
      needsIDProof: !user.kycId
    }

    userId = user.id
    await User.query().patchAndFetchById(user.id, { rapydWalletId: 'mocked' })
  }

  const createRapydControllerDepsMocked = (isFailure?: boolean) => {
    const rapydControllerDepsMocked = {
      accountService,
      walletAddressService,
      rapydService: isFailure ? mockedRapydFailureService : mockedRapydService
    }

    for (const key in rapydControllerDepsMocked)
      Reflect.set(
        rapydController,
        key,
        rapydControllerDepsMocked[key as keyof typeof rapydControllerDepsMocked]
      )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    accountService = await bindings.resolve('accountService')
    walletAddressService = await bindings.resolve('walletAddressService')
    rapydController = await bindings.resolve('rapydController')

    const accountServiceDepsMocked = {
      rafikiClient: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id),
        listAssets: () => mockedListAssets
      },
      ...mockRapyd
    }

    for (const key in accountServiceDepsMocked)
      Reflect.set(
        accountService,
        key,
        accountServiceDepsMocked[key as keyof typeof accountServiceDepsMocked]
      )

    const walletAddressServiceDepsMocked = {
      accountService,
      rafikiClient: {
        createRafikiWalletAddress: () => ({
          id: uuid(),
          url: faker.internet.url()
        })
      }
    }
    for (const key in accountServiceDepsMocked)
      Reflect.set(
        walletAddressService,
        key,
        walletAddressServiceDepsMocked[
          key as keyof typeof walletAddressServiceDepsMocked
        ]
      )

    createRapydControllerDepsMocked()
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
    createRapydControllerDepsMocked()
  })

  describe('Get country Name', () => {
    it('should return a random country name', async () => {
      await rapydController.getCountryNames(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createRapydControllerDepsMocked(true)
      await rapydController.getCountryNames(req, res, (err) => {
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

  describe('Get Document Types', () => {
    it('should return random doc data', async () => {
      await rapydController.getDocumentTypes(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createRapydControllerDepsMocked(true)
      await rapydController.getDocumentTypes(req, res, (err) => {
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

  describe('Create Wallet', () => {
    it('should return payment pointer', async () => {
      req.body = mockCreateWalletRequest().body
      await rapydController.createWallet(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Wallet created succesfully',
        data: {
          userId,
          wallet: 'mocked_wallet'
        }
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createRapydControllerDepsMocked(true)
      req.body = mockCreateWalletRequest().body
      await rapydController.createWallet(req, res, (err) => {
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

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      req.body = mockCreateWalletRequest().body
      delete req.body.zip

      await rapydController.createWallet(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('Verify Identity', () => {
    it('should return an object with id and reference_id', async () => {
      req.body = mockVerifyIdentityRequest().body
      await rapydController.verifyIdentity(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Wallet created succesfully'
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createRapydControllerDepsMocked(true)
      req.body = mockVerifyIdentityRequest().body
      await rapydController.verifyIdentity(req, res, (err) => {
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

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      req.body = mockVerifyIdentityRequest().body
      delete req.body.faceImage

      await rapydController.verifyIdentity(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('Update Profile', () => {
    it('should return void if no problem', async () => {
      req.body = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      }
      await rapydController.updateProfile(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Profile updated succesfully'
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createRapydControllerDepsMocked(true)
      req.body = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName()
      }
      await rapydController.updateProfile(req, res, (err) => {
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

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      req.body = {
        firstName: faker.person.firstName()
      }

      await rapydController.updateProfile(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })
})
