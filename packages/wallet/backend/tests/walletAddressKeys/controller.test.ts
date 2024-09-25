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
import { mockLogInRequest } from '@/tests/mocks'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createUser } from '@/tests/helpers'
import { truncateTables } from '@shared/backend/tests'
import { faker } from '@faker-js/faker'
import { WalletAddressKeyController } from '@/walletAddressKeys/controller'
import { WalletAddressKeyService } from '@/walletAddressKeys/service'

describe('Wallet Address Keys Controller', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let walletAddressKeyController: WalletAddressKeyController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userId: string
  let walletAddressKeyServiceMock: Partial<WalletAddressKeyService>
  const keyResponse = {
    privateKey: faker.lorem.slug(5),
    publicKey: faker.lorem.slug(5),
    keyId: faker.string.uuid(),
    nickname: faker.lorem.word()
  }

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
      needsWallet: !user.gateHubUserId,
      needsIDProof: !user.kycVerified
    }
    userId = user.id
    await User.query().patchAndFetchById(user.id, { gateHubUserId: 'mocked' })
  }

  const createMockWalletAddressKeyControllerDeps = () => {
    walletAddressKeyServiceMock = {
      revokeKey: () => Promise.resolve(),
      uploadKey: () => Promise.resolve(),
      patch: () => Promise.resolve(),
      registerKey: () => Promise.resolve(keyResponse),
      listByWalletId: () => Promise.resolve([])
    }
    Reflect.set(
      walletAddressKeyController,
      'walletAddressKeyService',
      walletAddressKeyServiceMock
    )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    walletAddressKeyController = await bindings.resolve(
      'walletAddressKeyController'
    )

    createMockWalletAddressKeyControllerDeps()
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
  })

  describe('List', () => {
    it('should call listByWalletId', async () => {
      const listSpy = jest.spyOn(walletAddressKeyServiceMock, 'listByWalletId')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid()
      }

      await walletAddressKeyController.list(req, res, next)
      expect(listSpy).toHaveBeenCalledWith({ userId, ...req.params })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('result')
      expect(res._getJSONData().result).toStrictEqual([])
    })
  })

  describe('Patch', () => {
    it('should call patch', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'patch')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid(),
        keyId: faker.string.uuid()
      }

      req.body = {
        nickname: faker.lorem.word()
      }

      await walletAddressKeyController.patchKey(req, res, next)
      expect(spy).toHaveBeenCalledWith({ userId, ...req.params, ...req.body })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Public key nickname updated.'
      })
    })

    it('should fail nickname validation', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'patch')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid(),
        keyId: faker.string.uuid()
      }

      req.body = { nickname: 1 }

      await walletAddressKeyController.patchKey(req, res, next)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('Register key', () => {
    it('should call registerKey', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'registerKey')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid()
      }

      req.body = {
        nickname: faker.lorem.word()
      }

      await walletAddressKeyController.registerKey(req, res, next)
      expect(spy).toHaveBeenCalledWith({ userId, ...req.params, ...req.body })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Public key is successfully registered.'
      })
      expect(res._getJSONData().result).toMatchObject(keyResponse)
    })

    it('should fail nickname validation', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'registerKey')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid(),
        keyId: faker.string.uuid()
      }

      req.body = { nickname: 1 }

      await walletAddressKeyController.registerKey(req, res, next)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('Upload key', () => {
    it('should call uploadKey', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'uploadKey')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid()
      }

      req.body = {
        nickname: faker.lorem.word(),
        base64Key: faker.lorem.word()
      }

      await walletAddressKeyController.uploadKey(req, res, next)
      expect(spy).toHaveBeenCalledWith({ userId, ...req.params, ...req.body })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Public key is successfully uploaded.'
      })
    })

    it('should fail validation', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'uploadKey')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid()
      }

      req.body = {}

      await walletAddressKeyController.uploadKey(req, res, next)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('Revoke key', () => {
    it('should call revokeKey', async () => {
      const spy = jest.spyOn(walletAddressKeyServiceMock, 'revokeKey')
      req.params = {
        accountId: faker.string.uuid(),
        walletAddressId: faker.string.uuid(),
        keyId: faker.string.uuid()
      }

      await walletAddressKeyController.revokeKey(req, res, next)
      expect(spy).toHaveBeenCalledWith({ userId, ...req.params, ...req.body })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Public key was successfully revoked.'
      })
    })
  })
})
