import { createContainer } from '@/createContainer'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/shared/container'
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
import type { UserService } from '@/user/service'
import { mockedListAssets, mockLogInRequest } from '../mocks'
import { AccountController } from '@/account/controller'
import { AccountService } from '@/account/service'
import { User } from '@/user/model'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { BaseError } from '@/errors/Base'

describe('Asset Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let userService: UserService
  let accountController: AccountController
  let accountService: AccountService
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  const mockedAsset = mockedListAssets[0]
  const accountName = 'Hmmpotato'
  let createdAccount: Account

  const next = jest.fn()
  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    userService = await bindings.resolve('userService')
    accountController = await bindings.resolve('accountController')
    accountService = await bindings.resolve('accountService')

    const accountServiceDepsMocked = {
      accountService: await bindings.resolve('accountService'),

      rafiki: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id)
      },
      rapyd: {
        issueVirtualAccount: () => ({
          status: {
            status: 'SUCCESS'
          },
          data: {
            id: 'mocked'
          }
        }),
        simulateBankTransferToWallet: () => ({
          status: {
            status: 'SUCCESS'
          },
          data: {
            transactions: [
              {
                id: 'mocked'
              }
            ]
          }
        }),
        withdrawFundsFromAccount: () => ({
          status: {
            status: 'SUCCESS'
          }
        }),
        getAccountsBalance: () => ({
          data: [
            {
              currency: mockedAsset.code,
              balance: 777
            }
          ] as Partial<RapydAccountBalance>
        })
      }
    }
    Reflect.set(accountService, 'deps', accountServiceDepsMocked)

    const accountControllerDepsMocked = {
      accountService
    }
    Reflect.set(accountController, 'deps', accountControllerDepsMocked)

    const req = createRequest()
    req.body = args
    await userService.create(args)
  })

  beforeEach(async (): Promise<void> => {
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
    await User.query().patchAndFetchById(user.id, { rapydWalletId: 'mocked' })
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
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
        data: {
          name: accountName
        }
      })
      createdAccount = res._getJSONData().data
    })
  })
  describe('listAccounts', (): void => {
    it("should list User's accounts (1 account, after creation)", async (): Promise<void> => {
      await accountController.listAccounts(req, res, next)
      expect(res.statusCode).toBe(200)

      const jsonData = res._getJSONData()
      expect(jsonData.message).toEqual('SUCCESS')
      expect(jsonData.data.length).toEqual(1)
      expect(jsonData.data[0]).toMatchObject({
        name: accountName
      })
    })
  })

  describe('getAccountById', (): void => {
    it("should get User's Account by id", async (): Promise<void> => {
      req.params = {
        id: createdAccount.id
      }

      await accountController.getAccountById(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS',
        data: {
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
  describe('fundAccount', (): void => {
    it("should fund User's Account", async (): Promise<void> => {
      req.body = {
        accountId: createdAccount.id,
        amount: 5.7
      }

      await accountController.fundAccount(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Account funded'
      })
    })
  })
  describe('withdrawFunds', (): void => {
    it("should withdraw from User's Account", async (): Promise<void> => {
      req.body = {
        accountId: createdAccount.id,
        amount: 3
      }

      await accountController.withdrawFunds(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Funds withdrawn'
      })
    })
  })
})
