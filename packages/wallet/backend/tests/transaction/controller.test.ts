import { AwilixContainer } from 'awilix'
import { Cradle, createContainer } from '@/createContainer'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { TransactionController } from '@/transaction/controller'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import {
  generateMockedTransaction,
  mockedListAssets,
  mockedTransactionInsertObjs,
  mockLogInRequest
} from '@/tests/mocks'
import { WalletAddress } from '@/walletAddress/model'
import { env } from '@/config/env'
import { applyMiddleware } from '@/tests/utils'
import { truncateTables } from '@shared/backend/tests'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { Request, Response } from 'express'
import { createUser, errorHandler } from '@/tests/helpers'
import { PartialModelObject } from 'objection'
import { Transaction } from '@/transaction/model'

describe('Transaction Controller', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let transactionController: TransactionController
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
      needsWallet: !user.gateHubUserId,
      needsIDProof: !user.kycVerified
    }

    userId = user.id
    await User.query().patchAndFetchById(user.id, { gateHubUserId: 'mocked' })
  }

  const prepareTransactionDependencies = async () => {
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

  const prepareControllerDeps = (
    fields: PartialModelObject<Transaction> = {}
  ) => {
    const transactionsControllerDepsMocked = {
      list: () => [
        generateMockedTransaction(fields),
        generateMockedTransaction()
      ],
      listAll: () => mockedTransactionInsertObjs
    }

    Reflect.set(
      transactionController,
      'transactionService',
      transactionsControllerDepsMocked
    )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    transactionController = await bindings.resolve('transactionController')
    prepareControllerDeps()
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

  describe('Get list of transactions', () => {
    it('should return array of transactions', async () => {
      const { account, walletAddress } = await prepareTransactionDependencies()
      prepareControllerDeps({
        walletAddressId: walletAddress.id,
        accountId: account.id
      })
      req.params = {
        accountId: account.id,
        walletAddressId: walletAddress.id
      }
      req.query = { orderByDate: 'ASC' }
      await transactionController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData().result).toHaveLength(2)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })

      expect(res._getJSONData().result[0]).toMatchObject({
        walletAddressId: walletAddress.id,
        accountId: account.id
      })
    })

    it('should return status 400 if the request body is not valid', async () => {
      req.query = { orderByDate: 'wrong' }
      await transactionController.list(req, res, (err) => {
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

  describe('ListAll', () => {
    it('should return array of transactions', async () => {
      await transactionController.listAll(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData().result).toHaveLength(
        mockedTransactionInsertObjs.length
      )
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
      const data = res._getJSONData().result[0]
      expect(data).toHaveProperty('walletAddressId')
      expect(data).toHaveProperty('accountId')
      expect(data).toHaveProperty('paymentId')
      expect(data).toHaveProperty('assetCode')
    })

    it('should return status 400 if the request body is not valid', async () => {
      req.query = { page: '-1', orderByDate: 'wrong' }
      await transactionController.listAll(req, res, (err) => {
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
