import { Container } from '@/shared/container'
import { Bindings } from '@/app'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import { PaymentPointerController } from '@/paymentPointer/controller'
import {
  mockedListAssets,
  mockLogInRequest,
  mockPaymentPointer
} from '@/tests/mocks'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createUser } from '@/tests/helpers'
import { truncateTables } from '@/tests/tables'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { PaymentPointer } from '@/paymentPointer/model'
import { errorHandler } from '@/middleware/errorHandler'

describe('Payment Pointer', () => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let ppController: PaymentPointerController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userId: string

  const next = jest.fn()
  const args = mockLogInRequest().body

  const preparePPDependencies = async () => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId,
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

  const createMockPaymentPointerControllerDeps = (isFailure?: boolean) => {
    const paymentPointer = isFailure
      ? jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
      : () => mockPaymentPointer
    const ppControllerDepsMocked = {
      paymentPointerService: {
        create: paymentPointer,
        list: () => [mockPaymentPointer],
        listAll: () => [mockPaymentPointer],
        getExternalPaymentPointer: paymentPointer,
        getById: paymentPointer,
        softDelete: jest.fn(),
        registerKey: () => ({
          privateKey: faker.lorem.slug(5),
          publicKey: faker.lorem.slug(5),
          keyId: faker.string.uuid()
        }),
        revokeKey: jest.fn(),
        update: jest.fn()
      }
    }
    Reflect.set(ppController, 'deps', ppControllerDepsMocked)
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    ppController = await bindings.resolve('paymentPointerController')

    createMockPaymentPointerControllerDeps()
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
    createMockPaymentPointerControllerDeps()
  })

  describe('Create Payment Pointer', () => {
    it('should return PaymentPointer', async () => {
      const { account } = await preparePPDependencies()
      req.params = {
        accountId: account.id
      }
      req.body = {
        paymentPointerName: faker.lorem.slug(),
        publicName: faker.lorem.words({ min: 2, max: 2 }),
        isWM: false
      }
      await ppController.create(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('data')
      expect(res._getJSONData()['data']).toHaveProperty('publicName')
    })

    it('should fail with status 500 on unexpected error', async () => {
      createMockPaymentPointerControllerDeps(true)
      const { account } = await preparePPDependencies()
      req.params = {
        accountId: account.id
      }
      req.body = {
        paymentPointerName: faker.lorem.slug(),
        publicName: faker.lorem.words({ min: 2, max: 2 }),
        isWM: false
      }
      await ppController.create(req, res, (err) => {
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

  describe('Get List of Payment Pointer', () => {
    it('should return array of Payment Pointer', async () => {
      const { account } = await preparePPDependencies()
      req.params = {
        accountId: account.id
      }
      await ppController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('data')
      const data = res._getJSONData().data
      expect(data).toHaveLength(1)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('url')
      expect(data[0]).toHaveProperty('publicName')
    })
  })

  describe('Get List All of Payment Pointer', () => {
    it('should return array of Payment Pointer', async () => {
      const { account } = await preparePPDependencies()
      req.params = {
        accountId: account.id
      }
      await ppController.listAll(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('data')
      const data = res._getJSONData().data
      expect(data).toHaveLength(1)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('url')
      expect(data[0]).toHaveProperty('publicName')
    })
  })

  describe('Get External Payment Pointer', () => {
    it('should return a Payment Pointer', async () => {
      req.query = {
        url: faker.internet.url()
      }
      await ppController.getExternalPaymentPointer(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('data')
      const data = res._getJSONData().data
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('url')
      expect(data).toHaveProperty('publicName')
    })
  })

  describe('Get Payment Pointer by ID', () => {
    it('should return a Payment Pointer', async () => {
      const { account } = await preparePPDependencies()
      req.params = {
        accountId: account.id,
        id: faker.string.uuid()
      }
      await ppController.getById(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      expect(res._getJSONData()).toHaveProperty('data')
      const data = res._getJSONData().data
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('url')
      expect(data).toHaveProperty('publicName')
    })
  })

  describe('Soft Delete Payment Pointer', () => {
    it('should return confirmation message', async () => {
      req.params = {
        id: faker.string.uuid()
      }
      await ppController.softDelete(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Payment pointer was successfully deleted'
      })
    })
  })

  describe('Register Key', () => {
    it('should return object with private & public key', async () => {
      const { account, paymentPointer } = await preparePPDependencies()
      req.params = {
        accountId: account.id,
        paymentPointerId: paymentPointer.id
      }
      await ppController.registerKey(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Public key is successfully registered'
      })
      expect(res._getJSONData()).toHaveProperty('data')
      expect(res._getJSONData()['data']).toHaveProperty('privateKey')
      expect(res._getJSONData()['data']).toHaveProperty('publicKey')
      expect(res._getJSONData()['data']).toHaveProperty('keyId')
    })
  })

  describe('Revoke Key', () => {
    it('should return confirmation message', async () => {
      const { account, paymentPointer } = await preparePPDependencies()
      req.params = {
        accountId: account.id,
        paymentPointerId: paymentPointer.id
      }
      await ppController.revokeKey(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Key was successfully revoked.'
      })
    })
  })

  describe('Update', () => {
    it('should return confirmation message', async () => {
      const { account, paymentPointer } = await preparePPDependencies()
      req.params = {
        accountId: account.id,
        paymentPointerId: paymentPointer.id
      }
      req.body = {
        publicName: faker.lorem.word()
      }
      await ppController.update(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Payment pointer was successfully updated.'
      })
    })
  })
})
