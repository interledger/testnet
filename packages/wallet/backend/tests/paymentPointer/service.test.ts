import { Container } from '@/shared/container'
import { Bindings } from '@/app'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { PaymentPointerService } from '@/paymentPointer/service'
import { AccountService } from '@/account/service'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { mockedListAssets } from '@/tests/mocks'
import { PaymentPointer } from '@/paymentPointer/model'
import { createContainer } from '@/createContainer'
import { Env, env } from '@/config/env'
import { loginUser } from '@/tests/utils'
import { truncateTables } from '@/tests/tables'
import { NotFound } from '@/errors'
import axios from 'axios'

describe('Payment Pointer Service', () => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let ppService: PaymentPointerService
  let accountService: AccountService
  let serviceEnv: Env
  let userId: string

  const preparePPDependencies = async (
    paymentPointerName: string,
    isAccountAssigned = true
  ) => {
    let extraAcc = {} as Account
    if (!isAccountAssigned)
      extraAcc = await Account.query().insert({
        name: faker.string.alpha(10),
        userId,
        assetCode: mockedListAssets[0].code,
        assetId: mockedListAssets[0].id,
        assetScale: mockedListAssets[0].scale,
        virtualAccountId: 'mocked'
      })

    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId,
      assetCode: mockedListAssets[0].code,
      assetId: mockedListAssets[0].id,
      assetScale: mockedListAssets[0].scale,
      virtualAccountId: 'mocked'
    })

    const paymentPointer = await PaymentPointer.query().insert({
      url: `${serviceEnv.OPEN_PAYMENTS_HOST}/${paymentPointerName}`,
      publicName: faker.string.alpha(10),
      accountId: isAccountAssigned ? account.id : extraAcc.id,
      id: faker.string.uuid()
    })

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
    ppService = await bindings.resolve('paymentPointerService')
    accountService = await bindings.resolve('accountService')
    serviceEnv = await bindings.resolve('env')

    const ppServiceDepsMocked = {
      accountService,
      env: serviceEnv,
      rafikiClient: {
        createRafikiPaymentPointer: () => ({
          id: faker.string.uuid(),
          url: faker.internet.url()
        }),
        createRafikiPaymentPointerKey: () => ({
          id: faker.string.uuid()
        }),
        revokePaymentPointerKey: jest.fn(),
        updatePaymentPointer: jest.fn()
      }
    }

    Reflect.set(ppService, 'deps', ppServiceDepsMocked)
  })

  beforeEach(async (): Promise<void> => {
    const extraUserArgs = {
      isEmailVerified: true,
      rapydWalletId: 'mocked'
    }

    const { user } = await loginUser({
      authService,
      extraUserArgs
    })
    userId = user.id
  })
  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })
  describe('Create Payment Pointer', () => {
    it('should return an existed PaymentPointer', async () => {
      const { account } = await preparePPDependencies('my-wallet')
      const result = await ppService.create(
        userId,
        account.id,
        'my-wallet',
        'My Wallet'
      )
      expect(result).toHaveProperty('publicName')
      expect(result).toHaveProperty('accountId')
      expect(result).toHaveProperty('url')
      expect(result).toMatchObject({
        publicName: 'My Wallet',
        url: `${serviceEnv.OPEN_PAYMENTS_HOST}/my-wallet`
      })
    })

    it('should return an new PaymentPointer', async () => {
      const { account } = await preparePPDependencies('my-work')
      const result = await ppService.create(
        userId,
        account.id,
        'my-wallet',
        'My Wallet'
      )
      expect(result).toHaveProperty('publicName')
      expect(result).toHaveProperty('accountId')
      expect(result).toHaveProperty('url')
      expect(result).toMatchObject({
        publicName: 'My Wallet'
      })
    })

    it('should return repetitive err', async () => {
      const { account } = await preparePPDependencies('my-work', false)

      await expect(
        ppService.create(userId, account.id, 'my-work', 'My Work')
      ).rejects.toThrowError(
        /This payment pointer already exists. Please choose another name./
      )
    })
  })

  describe('List & listAll PaymentPointer', () => {
    it('should return list of PaymentPointer', async () => {
      const { account, paymentPointer } =
        await preparePPDependencies('my-wallet')
      const result = await ppService.list(userId, account.id)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: paymentPointer.url,
        accountId: account.id
      })
    })

    it('should return listAll of PaymentPointer', async () => {
      const { account, paymentPointer } =
        await preparePPDependencies('my-wallet')
      const result = await ppService.listAll(userId)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        url: paymentPointer.url,
        accountId: account.id
      })
    })
  })

  describe('Get by Id', () => {
    it('should return a PaymentPointer Object', async () => {
      const { account, paymentPointer } =
        await preparePPDependencies('my-wallet')
      const result = await ppService.getById(
        userId,
        account.id,
        paymentPointer.id
      )
      expect(result).toMatchObject({
        id: paymentPointer.id,
        url: paymentPointer.url,
        accountId: account.id
      })
    })
  })

  describe('Get list of Identifiers By UserId', () => {
    it('should return array of users PaymentPointer urls', async () => {
      await preparePPDependencies('my-wallet')
      const result = await ppService.listIdentifiersByUserId(userId)
      const expected = [`${serviceEnv.OPEN_PAYMENTS_HOST}/my-wallet`]
      expect(result).toEqual(expect.arrayContaining(expected))
    })
  })

  describe('Is belong To User', () => {
    it('should return an boolean', async () => {
      const { paymentPointer } = await preparePPDependencies('my-wallet')
      const result = await ppService.belongsToUser(userId, paymentPointer.url)
      expect(result).toBeTruthy()
    })
  })

  describe('Soft delete', () => {
    it('should return undefined', async () => {
      const { paymentPointer } = await preparePPDependencies('my-wallet')
      const result = await ppService.softDelete(userId, paymentPointer.id)
      expect(result).toBeUndefined()
    })

    it('should reject NotFound', async () => {
      await expect(
        ppService.softDelete(userId, faker.string.uuid())
      ).rejects.toThrowError(NotFound)
    })
  })

  describe('Register Key', () => {
    it('should return privateKey, publicKey and keyId as an object', async () => {
      const { account, paymentPointer } =
        await preparePPDependencies('my-wallet')
      const result = await ppService.registerKey(
        userId,
        account.id,
        paymentPointer.id
      )
      expect(result).toHaveProperty('privateKey')
      expect(result).toHaveProperty('publicKey')
      expect(result).toHaveProperty('keyId')
    })
  })

  describe('Revoke Key', () => {
    it('should return undefined', async () => {
      const { account, paymentPointer } =
        await preparePPDependencies('my-wallet')
      await ppService.registerKey(userId, account.id, paymentPointer.id)
      const result = await ppService.revokeKey(
        userId,
        account.id,
        paymentPointer.id
      )
      expect(result).toBeUndefined()
    })
  })

  describe('َUpdate', () => {
    it('should return undefined', async () => {
      const { account, paymentPointer } =
        await preparePPDependencies('my-wallet')
      const result = await ppService.update({
        userId: userId,
        accountId: account.id,
        paymentPointerId: paymentPointer.id,
        publicName: 'my-work'
      })
      expect(result).toBeUndefined()

      const foundPP = await ppService.getById(
        userId,
        account.id,
        paymentPointer.id
      )

      expect(foundPP.publicName).toEqual('my-work')
    })

    describe('Get External PaymentPointer', () => {
      beforeAll(async (): Promise<void> => {
        axios.get = jest.fn().mockImplementation(() =>
          Promise.resolve({
            data: {
              url: `${serviceEnv.OPEN_PAYMENTS_HOST}/test`,
              publicName: 'Test Wallet',
              assetCode: 'USD',
              assetScale: 2
            }
          })
        )
      })

      it('should return a PaymentPointer Object', async () => {
        const result = await ppService.getExternalPaymentPointer(
          `${serviceEnv.OPEN_PAYMENTS_HOST}/wallet`
        )
        expect(result).toMatchObject({
          url: `${serviceEnv.OPEN_PAYMENTS_HOST}/test`,
          publicName: 'Test Wallet',
          assetCode: 'USD',
          assetScale: 2
        })
      })
    })
  })
})
