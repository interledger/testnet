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
import { mockedListAssets, mockedTransactionInsertObjs } from '../mocks'
import { TransactionService } from '@/transaction/service'
import { Transaction } from '@/transaction/model'
import { AccountService } from '@/account/service'
import { PaymentPointerService } from '@/paymentPointer/service'
import { faker } from '@faker-js/faker'
import { loginUser } from '@/tests/utils'

describe('Transaction Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let accountService: AccountService
  let paymentPointerService: PaymentPointerService
  let transactionService: TransactionService
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  // "dependency" = ALL foreign keys (paymentPointers, account, user...)
  const prepareTransactionDependencies = async ({ req }: { req: Request }) => {
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
      userId: req.session.user.id,
      name: faker.string.alpha(10),
      assetId: mockedListAssets[0].id
    })
    const paymentPointer = await paymentPointerService.create(
      req.session.user.id,
      account.id,
      faker.string.alpha(10),
      faker.string.alpha(10)
    )

    return {
      account,
      paymentPointer
    }
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    accountService = await bindings.resolve('accountService')
    paymentPointerService = await bindings.resolve('paymentPointerService')
    transactionService = await bindings.resolve('transactionService')
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()

    await loginUser({
      req,
      res,
      authService,
      extraUserArgs: {
        isEmailVerified: true,
        rapydWalletId: 'mocked'
      }
    })
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
      const { paymentPointer, account } = await prepareTransactionDependencies({
        req
      })

      await Promise.all(
        mockedTransactionInsertObjs.map(async (mockedTransactionInsertObj) =>
          Transaction.query().insert({
            ...mockedTransactionInsertObj,
            paymentPointerId: paymentPointer.id,
            accountId: account.id
          })
        )
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

  describe('listAll [pagination]', (): void => {
    it('should list all transactions (4 transactions, 2x per page)', async (): Promise<void> => {
      const { paymentPointer, account } = await prepareTransactionDependencies({
        req
      })

      await Promise.all(
        mockedTransactionInsertObjs.map(async (mockedTransactionInsertObj) =>
          Transaction.query().insert({
            ...mockedTransactionInsertObj,
            paymentPointerId: paymentPointer.id,
            accountId: account.id
          })
        )
      )

      const transactionsPage1 = await transactionService.listAll({
        userId: req.session.user.id,
        paginationParams: {
          page: 0,
          pageSize: 2
        },
        filterParams: {},
        orderByDate: 'asc'
      })
      const transactionsPage2 = await transactionService.listAll({
        userId: req.session.user.id,
        paginationParams: {
          page: 1,
          pageSize: 2
        },
        filterParams: {},
        orderByDate: 'asc'
      })

      expect(transactionsPage1.total).toEqual(
        mockedTransactionInsertObjs.length
      )
      expect(transactionsPage2.total).toEqual(
        mockedTransactionInsertObjs.length
      )
      expect(transactionsPage1.results.length).toEqual(2)
      expect(transactionsPage2.results.length).toEqual(2)
      const transactionIds = new Set([
        transactionsPage1.results[0].id,
        transactionsPage1.results[1].id,
        transactionsPage2.results[0].id,
        transactionsPage2.results[1].id
      ])
      expect(transactionIds.size).toEqual(4)
    })

    it('should list all transactions (4 transactions, 3x per page)', async (): Promise<void> => {
      const { paymentPointer, account } = await prepareTransactionDependencies({
        req
      })

      await Promise.all(
        mockedTransactionInsertObjs.map(async (mockedTransactionInsertObj) =>
          Transaction.query().insert({
            ...mockedTransactionInsertObj,
            paymentPointerId: paymentPointer.id,
            accountId: account.id
          })
        )
      )

      const transactionsPage1 = await transactionService.listAll({
        userId: req.session.user.id,
        paginationParams: {
          page: 0,
          pageSize: 3
        },
        filterParams: {},
        orderByDate: 'asc'
      })
      const transactionsPage2 = await transactionService.listAll({
        userId: req.session.user.id,
        paginationParams: {
          page: 1,
          pageSize: 3
        },
        filterParams: {},
        orderByDate: 'asc'
      })

      expect(transactionsPage1.total).toEqual(
        mockedTransactionInsertObjs.length
      )
      expect(transactionsPage2.total).toEqual(
        mockedTransactionInsertObjs.length
      )
      expect(transactionsPage1.results.length).toEqual(3)
      expect(transactionsPage2.results.length).toEqual(1)
      const transactionIds = new Set([
        transactionsPage1.results[0].id,
        transactionsPage1.results[1].id,
        transactionsPage1.results[2].id,
        transactionsPage2.results[0].id
      ])
      expect(transactionIds.size).toEqual(4)
    })
  })
})
