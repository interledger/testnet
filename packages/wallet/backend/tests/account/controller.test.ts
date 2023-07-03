import { createContainer } from '@/createContainer'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/shared/container'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@/tests/tables'
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
import { Scalars } from '@/rafiki/generated/graphql'
import { AccountController } from '@/account/controller'
import { AccountService } from '@/account/service'
import { User } from '@/user/model'

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
        getAssetById: (id: Scalars['ID']) =>
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
        simulateBankTransferToWallet: () => null,
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
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()

    req.body = args

    await userService.create(args)
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

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('createAccount', (): void => {
    it('should create Account for User for a given Asset', async (): Promise<void> => {
      const name = 'Hmm'

      req.body = {
        name,
        assetId: mockedAsset.id
      }
      await accountController.createAccount(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS',
        data: {
          name
        }
      })
    })
  })
  // describe('listAccounts', (): void => {
  //   it("should list User's accounts", async (): Promise<void> => {
  //     expect(1).toBeTruthy()
  //   })
  // })
  // describe('getAccountById', (): void => {
  //   it("should get user's Account by id", async (): Promise<void> => {
  //     expect(1).toBeTruthy()
  //   })
  // })
  // describe('fundAccount', (): void => {
  //   it("should fund User's Account", async (): Promise<void> => {
  //     expect(1).toBeTruthy()
  //   })
  // })
  // describe('withdrawFunds', (): void => {
  //   it("should withdraw from User's Account", async (): Promise<void> => {
  //     expect(1).toBeTruthy()
  //   })
  // })
})
