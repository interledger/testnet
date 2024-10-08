import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { SocketService } from '@/socket/service'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { truncateTables } from '@shared/backend/tests'
import { AuthService } from '@/auth/service'
import { Request, Response } from 'express'
import {
  mockCreateAccountReq,
  mockedAmount,
  mockedListAssets,
  mockGateHubClient,
  mockLogInRequest
} from '@/tests/mocks'
import { AccountService } from '@/account/service'
import { createUser } from '../helpers'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { withSession } from '@/middleware/withSession'
import { applyMiddleware } from '../utils'
import { User } from '@/user/model'
import { AwilixContainer } from 'awilix'
import MessageType from '@/socket/messageType'

describe('Socket Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let socketService: SocketService
  let accountService: AccountService
  let authService: AuthService
  let userId: string
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    socketService = await bindings.resolve('socketService')
    accountService = await bindings.resolve('accountService')

    const accountServiceDepsMocked = {
      rafikiClient: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id)
      },
      gateHubClient: mockGateHubClient
    }
    for (const key in accountServiceDepsMocked)
      Reflect.set(
        accountService,
        key,
        accountServiceDepsMocked[key as keyof typeof accountServiceDepsMocked]
      )

    const socketServiceDepsMocked = {
      accountService: await bindings.resolve('accountService')
    }

    Reflect.set(
      socketService,
      'accountService',
      socketServiceDepsMocked.accountService
    )
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()

    req.body = args

    await createUser({ ...args, isEmailVerified: true })
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
    await User.query().patchAndFetchById(userId, {
      gateHubUserId: 'mocked'
    })
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('emitMoney', () => {
    it('should return nothing in send', async () => {
      const createdMockAccount = await accountService.createAccount({
        ...mockCreateAccountReq,
        userId
      })
      const spy = jest
        .spyOn(accountService, 'getAccountByAssetCode')
        .mockReturnValue(Promise.resolve(createdMockAccount))

      const result = await socketService.emitMoneySentByUserId(
        userId,
        mockedAmount,
        MessageType.MONEY_SENT
      )
      expect(result).toBeUndefined()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toBeCalledWith(userId, {
        assetCode: mockedAmount.assetCode,
        assetScale: mockedAmount.assetScale,
        value: mockedAmount.value
      })
    })

    it('should return nothing in received', async () => {
      const createdMockAccount = await accountService.createAccount({
        ...mockCreateAccountReq,
        userId
      })
      const spy = jest
        .spyOn(accountService, 'getAccountByAssetCode')
        .mockReturnValue(Promise.resolve(createdMockAccount))

      const result = await socketService.emitMoneyReceivedByUserId(
        userId,
        mockedAmount
      )
      expect(result).toBeUndefined()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toBeCalledWith(userId, {
        assetCode: mockedAmount.assetCode,
        assetScale: mockedAmount.assetScale,
        value: mockedAmount.value
      })
    })
  })
})
