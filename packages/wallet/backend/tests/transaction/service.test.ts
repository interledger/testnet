import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import type { AuthService } from '@/auth/service'
import { mockedListAssets, mockedTransactionInsertObjs } from '../mocks'
import { TransactionService } from '@/transaction/service'
import { Transaction } from '@/transaction/model'
import { faker } from '@faker-js/faker'
import { loginUser } from '@/tests/utils'
import { Account } from '@/account/model'
import { WalletAddress } from '@/walletAddress/model'
import { AwilixContainer } from 'awilix'

describe('Transaction Service', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let transactionService: TransactionService
  let userId: string

  // "dependency" = ALL foreign keys (walletAddresses, account, user...)
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

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    transactionService = await bindings.resolve('transactionService')
  })

  beforeEach(async (): Promise<void> => {
    const extraUserArgs = {
      isEmailVerified: true,
      gateHubUserId: 'mocked'
    }

    const { user } = await loginUser({
      authService,
      extraUserArgs
    })
    userId = user.id
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('listAll', (): void => {
    it('should list all transactions (0 transactions)', async (): Promise<void> => {
      const transactions = await transactionService.listAll({
        userId,
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
      const { walletAddress, account } = await prepareTransactionDependencies()

      const insertedTransactions = mockedTransactionInsertObjs.map(
        (mockedTransactionInsertObj) => ({
          ...mockedTransactionInsertObj,
          walletAddressId: walletAddress.id,
          accountId: account.id
        })
      )
      await Transaction.query().insert(insertedTransactions)

      const transactions = await transactionService.listAll({
        userId,
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
      const { walletAddress, account } = await prepareTransactionDependencies()

      const insertedTransactions = mockedTransactionInsertObjs.map(
        (mockedTransactionInsertObj) => ({
          ...mockedTransactionInsertObj,
          walletAddressId: walletAddress.id,
          accountId: account.id
        })
      )
      await Transaction.query().insert(insertedTransactions)

      const transactionsPage1 = await transactionService.listAll({
        userId,
        paginationParams: {
          page: 0,
          pageSize: 2
        },
        filterParams: {},
        orderByDate: 'asc'
      })
      const transactionsPage2 = await transactionService.listAll({
        userId,
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
      const { walletAddress, account } = await prepareTransactionDependencies()

      const insertedTransactions = mockedTransactionInsertObjs.map(
        (mockedTransactionInsertObj) => ({
          ...mockedTransactionInsertObj,
          walletAddressId: walletAddress.id,
          accountId: account.id
        })
      )
      await Transaction.query().insert(insertedTransactions)

      const transactionsPage1 = await transactionService.listAll({
        userId,
        paginationParams: {
          page: 0,
          pageSize: 3
        },
        filterParams: {},
        orderByDate: 'asc'
      })
      const transactionsPage2 = await transactionService.listAll({
        userId,
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

  describe('updateTransaction', (): void => {
    it('should update transaction successfully', async () => {
      const { walletAddress, account } = await prepareTransactionDependencies()
      const transaction = mockedTransactionInsertObjs[0]
      transaction.walletAddressId = walletAddress.id
      transaction.accountId = account.id
      await Transaction.query().insert(transaction)
      const result = await transactionService.updateTransaction(
        { id: transaction.id },
        { walletAddressId: faker.string.uuid() }
      )
      expect(result).toBeUndefined()
    })
  })
})
