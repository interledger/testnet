import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { faker } from '@faker-js/faker'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { WalletAddressKeyService } from '@/walletAddressKeys/service'
import { WalletAddressKeys } from '@/walletAddressKeys/model'
import { Account } from '@/account/model'
import { mockedListAssets } from '@/tests/mocks'
import { WalletAddress } from '@/walletAddress/model'
import { loginUser } from '@/tests/utils'
import { AuthService } from '@/auth/service'
import { NotFound } from '@shared/backend'

describe('Wallet Address Key Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let walletAddressKeyService: WalletAddressKeyService
  let authService: AuthService
  let userId: string
  let rafikiClientMock: Record<string, () => unknown>

  const rafikiKeyId = faker.string.uuid()
  const walletAddress = {
    url: `https://test/${faker.lorem.slug()}`,
    publicName: faker.string.alpha(10),
    accountId: faker.string.uuid(),
    id: faker.string.uuid()
  }

  const prepareRelatedData = async () => {
    const extraUserArgs = {
      isEmailVerified: true,
      gateHubUserId: 'mocked'
    }

    const { user } = await loginUser({
      authService,
      extraUserArgs
    })
    userId = user.id

    await Account.query().insert({
      id: walletAddress.accountId,
      name: faker.string.alpha(10),
      userId,
      assetCode: mockedListAssets[0].code,
      assetId: mockedListAssets[0].id,
      assetScale: mockedListAssets[0].scale,
      gateHubWalletId: 'mocked'
    })

    await WalletAddress.query().insert(walletAddress)
  }

  function prepareWSKDepsMock() {
    rafikiClientMock = {
      createRafikiWalletAddressKey: () => ({
        id: rafikiKeyId
      }),
      revokeWalletAddressKey: jest.fn()
    }
    const wakServiceDepsMocked = {
      walletAddressService: {
        getById: () => Promise.resolve(walletAddress)
      },
      rafikiClient: rafikiClientMock
    }

    for (const key in wakServiceDepsMocked)
      Reflect.set(
        walletAddressKeyService,
        key,
        wakServiceDepsMocked[key as keyof typeof wakServiceDepsMocked]
      )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    walletAddressKeyService = await bindings.resolve('walletAddressKeyService')
    prepareWSKDepsMock()
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  beforeEach(async () => {
    await prepareRelatedData()
  })

  describe('Upload key', () => {
    it('should insert new key', async () => {
      const base64Key =
        'eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5IiwieCI6InpPMDJmSjVpWmJGMm9DNldiVHpfRTRiWF82cVctSkxGV0F3Mjg5Q1JxVEkiLCJraWQiOiJiMmM1OWIyYy1iMGQ3LTRhNGQtOWI0Zi0wNWExNTYxZTEyMDcifQ=='
      await walletAddressKeyService.uploadKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname: faker.lorem.word(),
        base64Key
      })
      const key = await WalletAddressKeys.query().first()
      expect(key).toHaveProperty('id')
      expect(key?.id).toBe('b2c59b2c-b0d7-4a4d-9b4f-05a1561e1207')
      expect(key?.rafikiId).toBe(rafikiKeyId)
      expect(key?.walletAddressId).toBe(walletAddress.id)
      expect(key).toHaveProperty('nickname')
      expect(key).toHaveProperty('publicKey')
    })

    it('should throw error if key is not valid', async () => {
      const base64Key = ''
      await expect(
        walletAddressKeyService.uploadKey({
          userId,
          accountId: walletAddress.accountId,
          walletAddressId: walletAddress.id,
          nickname: faker.lorem.word(),
          base64Key
        })
      ).rejects.toThrowError('The uploaded key is not in the correct format.')
    })
  })

  describe('Register key', () => {
    it('should insert new key', async () => {
      const nickname = faker.lorem.word()
      const result = await walletAddressKeyService.registerKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname
      })
      const key = await WalletAddressKeys.query().first()
      expect(key).toHaveProperty('id')
      expect(key?.rafikiId).toBe(rafikiKeyId)
      expect(key?.walletAddressId).toBe(walletAddress.id)
      expect(key?.nickname).toBe(nickname)
      expect(key).toHaveProperty('publicKey')

      expect(result.keyId).toBe(key?.id)
      expect(result).toHaveProperty('privateKey')
      expect(result).toHaveProperty('publicKey')
      expect(result.nickname).toBe(nickname)
    })
  })

  describe('Revoke key', () => {
    let newKey: WalletAddressKeys | undefined

    beforeEach(async () => {
      const nickname = faker.lorem.word()
      await walletAddressKeyService.registerKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname
      })

      newKey = await WalletAddressKeys.query().first()
    })

    it('should delete key', async () => {
      const spy = jest.spyOn(rafikiClientMock, 'revokeWalletAddressKey')

      await walletAddressKeyService.revokeKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        keyId: newKey?.id ?? ''
      })
      const key = await WalletAddressKeys.query().first()
      expect(key).toBeUndefined()
      expect(spy).toHaveBeenCalledWith(newKey?.rafikiId)
    })
  })

  describe('Barch revoke keys', () => {
    let newKey: WalletAddressKeys | undefined

    beforeEach(async () => {
      const nickname = faker.lorem.word()
      await walletAddressKeyService.registerKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname
      })

      newKey = await WalletAddressKeys.query().first()
    })

    it('should delete key', async () => {
      const spy = jest.spyOn(rafikiClientMock, 'revokeWalletAddressKey')

      await walletAddressKeyService.batchRevokeKeys(userId, [
        {
          accountId: walletAddress.accountId,
          walletAddressId: walletAddress.id,
          keyId: newKey?.id ?? ''
        }
      ])
      const key = await WalletAddressKeys.query().first()
      expect(key).toBeUndefined()
      expect(spy).toHaveBeenCalledWith(newKey?.rafikiId)
    })
  })

  describe('Patch key', () => {
    let newKey: WalletAddressKeys | undefined

    beforeEach(async () => {
      const nickname = faker.lorem.word()
      await walletAddressKeyService.registerKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname
      })

      newKey = await WalletAddressKeys.query().first()
    })

    it('should update key nickname', async () => {
      await walletAddressKeyService.patch({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        keyId: newKey?.id ?? '',
        nickname: 'test'
      })

      const key = await WalletAddressKeys.query().first()
      expect(key?.nickname).toBe('test')
    })
  })

  describe('List', () => {
    let newKey: WalletAddressKeys | undefined

    beforeEach(async () => {
      const nickname = faker.lorem.word()
      await walletAddressKeyService.registerKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname
      })

      newKey = await WalletAddressKeys.query().first()
    })

    it('should return list of keys', async () => {
      const result = await walletAddressKeyService.listByWalletId({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id
      })

      expect(result).toMatchObject([newKey])
    })

    it('should return empty list', async () => {
      const result = await walletAddressKeyService.listByWalletId({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: faker.string.uuid()
      })

      expect(result).toMatchObject([])
    })
  })

  describe('Get by id', () => {
    let newKey: WalletAddressKeys | undefined

    beforeEach(async () => {
      const nickname = faker.lorem.word()
      await walletAddressKeyService.registerKey({
        userId,
        accountId: walletAddress.accountId,
        walletAddressId: walletAddress.id,
        nickname
      })

      newKey = await WalletAddressKeys.query().first()
    })

    it('should return key', async () => {
      const result = await walletAddressKeyService.getById(
        walletAddress.id,
        newKey?.id ?? ''
      )

      expect(result).toMatchObject(newKey ?? {})
    })

    it('should return 404 for wrong wallet address id', async () => {
      await expect(
        walletAddressKeyService.getById(faker.string.uuid(), newKey?.id ?? '')
      ).rejects.toThrowError(NotFound)
    })

    it('should return 404 for wrong key id', async () => {
      await expect(
        walletAddressKeyService.getById(walletAddress.id, faker.string.uuid())
      ).rejects.toThrowError(NotFound)
    })
  })
})
