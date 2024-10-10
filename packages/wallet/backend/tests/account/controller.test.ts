import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { Request, Response } from 'express'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import type { AuthService } from '@/auth/service'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { mockedListAssets, mockGateHubClient, mockLogInRequest } from '../mocks'
import { AccountController } from '@/account/controller'
import { AccountService } from '@/account/service'
import { User } from '@/user/model'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { createUser } from '@/tests/helpers'
import { AwilixContainer } from 'awilix'
import { truncateTables } from '@shared/backend/tests'
import { BaseError } from '@shared/backend'

describe('Account Controller', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let accountController: AccountController
  let accountService: AccountService
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  const mockedAsset = mockedListAssets[0]
  const accountName = 'mocked account name'
  let createdAccount: Account

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
      needsIDProof: !user.kycVerified,
      customerId: user.customerId
    }
    await User.query().patchAndFetchById(user.id, {
      gateHubUserId: 'mocked'
    })
  }
  const createMockAccount = async () => {
    req.body = {
      name: accountName,
      assetId: mockedAsset.id
    }
    await accountController.createAccount(req, res, next)
    createdAccount = res._getJSONData().result
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    accountController = await bindings.resolve('accountController')
    accountService = await bindings.resolve('accountService')

    const accountServiceDepsMocked = {
      rafikiClient: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id)
      }
    }
    Reflect.set(
      accountService,
      'rafikiClient',
      accountServiceDepsMocked.rafikiClient
    )
    Reflect.set(accountService, 'gateHubClient', mockGateHubClient)

    Reflect.set(accountController, 'accountService', accountService)
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

  describe('createAccount', (): void => {
    it('should create Account for User for a given Asset', async (): Promise<void> => {
      req.body = {
        name: accountName,
        assetId: mockedAsset.id
      }
      await accountController.createAccount(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS',
        result: {
          name: accountName
        }
      })
    })
  })
  describe('listAccounts', (): void => {
    beforeEach(async (): Promise<void> => {
      await createMockAccount()
      await createReqRes()
    })
    it("should list User's accounts (1 account, after creation)", async (): Promise<void> => {
      await accountController.listAccounts(req, res, next)
      expect(res.statusCode).toBe(200)

      const jsonData = res._getJSONData()
      expect(jsonData.message).toEqual('SUCCESS')
      expect(jsonData.result.length).toEqual(1)
      expect(jsonData.result[0]).toMatchObject({
        name: accountName
      })
    })
  })

  describe('getAccountById', (): void => {
    beforeEach(async (): Promise<void> => {
      await createMockAccount()
      await createReqRes()
    })
    it("should get User's Account by id", async (): Promise<void> => {
      req.params = {
        id: createdAccount.id
      }

      await accountController.getAccountById(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS',
        result: {
          id: createdAccount.id,
          name: accountName
        }
      })
    })
    it("should NOT get User's Account by id, when it's not found", async (): Promise<void> => {
      req.params = {
        id: faker.string.uuid()
      }

      try {
        await accountController.getAccountById(req, res, next)
      } catch (err) {
        expect((err as BaseError).statusCode).toEqual(404)
      }
    })
  })
})
