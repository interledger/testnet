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
import {
  mockedListAssets,
  mockedTransactionInsertObjs,
  mockLogInRequest
} from '../mocks'
import { TransactionService } from '@/transaction/service'
import { Transaction } from '@/transaction/model'
import { AccountService } from '@/account/service'
import { PaymentPointerService } from '@/paymentPointer/service'
import { faker } from '@faker-js/faker'
import { User } from '@/user/model'

describe('Transaction Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let userService: UserService
  let accountService: AccountService
  let paymentPointerService: PaymentPointerService
  let transactionService: TransactionService
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userId: string

  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    userService = await bindings.resolve('userService')
    accountService = await bindings.resolve('accountService')
    paymentPointerService = await bindings.resolve('paymentPointerService')
    transactionService = await bindings.resolve('transactionService')
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
    userId = user.id
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('listAll', (): void => {
    it('should list all transactions (0 transactions)', async (): Promise<void> => {
      const transactions = await transactionService.listAll({
        userId: req.session.user.id,
        paginationParams: {
          page: 0,
          pageSize: Infinity
        },
        filterParams: {},
        orderByDate: 'asc'
      })

      expect(transactions.total).toEqual(0)
      expect(transactions.results.length).toEqual(0)
    })

    it('should list all transactions (4 transactions)', async (): Promise<void> => {
      const accountServiceDepsMocked = {
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
          getAccountsBalance: () => ({
            data: [
              {
                currency: mockedListAssets[0].code,
                balance: 777
              }
            ] as Partial<RapydAccountBalance>
          })
        }
      }
      const ppServiceDepsMocked = {
        accountService: await bindings.resolve('accountService'),
        env: await bindings.resolve('env'),
        rafikiClient: {
          createRafikiPaymentPointer: () => ({
            id: faker.string.uuid(),
            url: faker.string.alpha(10)
          })
        }
      }
      Reflect.set(accountService, 'deps', accountServiceDepsMocked)
      Reflect.set(paymentPointerService, 'deps', ppServiceDepsMocked)

      const account = await accountService.createAccount({
        userId,
        name: faker.string.alpha(10),
        assetId: mockedListAssets[0].id
      })
      const paymentPointer = await paymentPointerService.create(
        userId,
        account.id,
        faker.string.alpha(10),
        faker.string.alpha(10)
      )

      mockedTransactionInsertObjs.forEach(
        async (mockedTransactionInsertObj) =>
          await Transaction.query().insert({
            ...mockedTransactionInsertObj,
            paymentPointerId: paymentPointer.id,
            accountId: account.id
          })
      )

      const transactions = await transactionService.listAll({
        userId: req.session.user.id,
        paginationParams: {
          page: 0,
          pageSize: Infinity
        },
        filterParams: {},
        orderByDate: 'asc'
      })

      expect(transactions.total).toEqual(mockedTransactionInsertObjs.length)
      expect(transactions.results.length).toEqual(
        mockedTransactionInsertObjs.length
      )
    })
  })
})
