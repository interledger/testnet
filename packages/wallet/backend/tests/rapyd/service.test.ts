import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { RapydService } from '@/rapyd/service'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { loginUser } from '@/tests/utils'
import { truncateTables } from '@/tests/tables'
import {
  mockCreateWalletRequest,
  mockFailureRapyd,
  mockRapyd,
  mockVerifyIdentityRequest
} from '@/tests/mocks'
import { User } from '@/user/model'
import { faker } from '@faker-js/faker'
import { AwilixContainer } from 'awilix'

describe('Rapyd Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let rapydService: RapydService
  let userInfo: { id: string; email: string }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    rapydService = await bindings.resolve('rapydService')

    Reflect.set(rapydService, 'deps', mockRapyd)
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
    userInfo = {
      id: user.id,
      email: user.email
    }
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    Reflect.set(rapydService, 'deps', mockRapyd)
  })

  describe('Get Document Types', () => {
    it('should return an array of RapydDocumentType', async () => {
      await User.query().patchAndFetchById(userInfo.id, {
        country: faker.location.country()
      })
      const result = await rapydService.getDocumentTypes(userInfo.id)
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('type')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('isBackRequired')
    })

    it('should return Country err', async () => {
      await expect(
        rapydService.getDocumentTypes(userInfo.id)
      ).rejects.toThrowError(/User has no country/)
    })

    it('should return status failure', async () => {
      Reflect.set(rapydService, 'deps', mockFailureRapyd)
      await User.query().patchAndFetchById(userInfo.id, {
        country: faker.location.country()
      })
      await expect(
        rapydService.getDocumentTypes(userInfo.id)
      ).rejects.toThrowError(
        /Unable to get document types from rapyd : Test message for failure/
      )
    })
  })

  describe('Get Country Names', () => {
    it('should return Country label & value', async () => {
      const result = await rapydService.getCountryNames()
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('label')
      expect(result[0]).toHaveProperty('value')
    })

    it('should return status failure', async () => {
      Reflect.set(rapydService, 'deps', mockFailureRapyd)
      await expect(rapydService.getCountryNames()).rejects.toThrowError(
        /Unable to retrieve country names from rapyd, Test message for failure/
      )
    })
  })

  describe('Create Wallet', () => {
    const {
      body: { firstName, lastName, address, city, country, zip }
    } = mockCreateWalletRequest()

    it('should return RapydWallet', async () => {
      const { email, id } = userInfo
      const result = await rapydService.createWallet({
        firstName,
        lastName,
        address,
        city,
        country,
        zip,
        email,
        id
      })

      expect(result).toMatchObject({
        id: 'mocked',
        type: 'person'
      })
    })

    it('should return status failure', async () => {
      const { email, id } = userInfo
      Reflect.set(rapydService, 'deps', mockFailureRapyd)
      await expect(
        rapydService.createWallet({
          firstName,
          lastName,
          address,
          city,
          country,
          zip,
          email,
          id
        })
      ).rejects.toThrowError(
        /Unable to create wallet, Test message for failure/
      )
    })
  })

  describe('Verify Identity', () => {
    const {
      body: {
        documentType,
        frontSideImage,
        frontSideImageType,
        faceImage,
        faceImageType
      }
    } = mockVerifyIdentityRequest()
    it('should return id and reference_id', async () => {
      await User.query().patchAndFetchById(userInfo.id, {
        country: faker.location.country()
      })
      const result = await rapydService.verifyIdentity({
        userId: userInfo.id,
        documentType,
        frontSideImage,
        frontSideImageType,
        faceImage,
        faceImageType
      })

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('reference_id')
    })

    it('should return Country err', async () => {
      await expect(
        rapydService.getDocumentTypes(userInfo.id)
      ).rejects.toThrowError(/User has no country/)
    })

    it('should return status failure', async () => {
      Reflect.set(rapydService, 'deps', mockFailureRapyd)
      await User.query().patchAndFetchById(userInfo.id, {
        country: faker.location.country()
      })
      await expect(
        rapydService.verifyIdentity({
          userId: userInfo.id,
          documentType,
          frontSideImage,
          frontSideImageType,
          faceImage,
          faceImageType
        })
      ).rejects.toThrowError(
        /Unable to send kyc documents : Test message for failure/
      )
    })
  })

  describe('Update Profile', () => {
    it('should return RapydWallet', async () => {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const result = await rapydService.updateProfile(
        userInfo.id,
        firstName,
        lastName
      )
      expect(result).toMatchObject({
        id: 'mocked',
        first_name: firstName,
        last_name: lastName
      })
    })

    it('should return status failure', async () => {
      Reflect.set(rapydService, 'deps', mockFailureRapyd)
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      await expect(
        rapydService.updateProfile(userInfo.id, firstName, lastName)
      ).rejects.toThrowError(
        /Unable to update profile : Test message for failure/
      )
    })
  })
})
