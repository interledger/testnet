import { Container } from '@/shared/container'
import { Bindings } from '@/app'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { GrantService } from '@/grant/service'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { loginUser } from '@/tests/utils'
import { faker } from '@faker-js/faker'
import { truncateTables } from '@/tests/tables'
import { Forbidden } from '@/errors'
import { mockedListGrant } from '@/tests/mocks'
import { GrantFinalization, GrantState } from '@/rafiki/auth/generated/graphql'

describe('Grant Service', () => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let grantService: GrantService
  let userId: string

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    grantService = await bindings.resolve('grantService')

    createMockGrantServiceDeps()
  })

  const createMockGrantServiceDeps = (
    isFailure?: boolean,
    IsGrantInteractionRejected?: boolean
  ) => {
    const grantServiceDepsMocked = {
      walletAddressService: {
        belongsToUser: () => !isFailure
      },
      rafikiAuthService: {
        setInteractionResponse: jest
          .fn()
          .mockReturnValue(
            IsGrantInteractionRejected ? mockedListGrant[1] : mockedListGrant[0]
          ),
        revokeGrant: isFailure
          ? jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
          : jest.fn(),
        getGrantByInteraction: jest.fn().mockReturnValue({
          id: 'grant',
          access: [{ identifier: faker.internet.url() }]
        })
      }
    }

    Reflect.set(grantService, 'deps', grantServiceDepsMocked)
  }

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
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    createMockGrantServiceDeps()
  })

  describe('Get Grant By Interaction', () => {
    it('should return a grant', async () => {
      const result = await grantService.getGrantByInteraction(
        userId,
        'test1',
        'test2'
      )
      expect(result).toMatchObject({
        id: 'grant'
      })
      expect(result).toHaveProperty('access')
      expect(result.access).toHaveLength(1)
      expect(result.access[0]).toHaveProperty('identifier')
    })

    it('should return no access err', async () => {
      createMockGrantServiceDeps(true)
      await expect(
        grantService.getGrantByInteraction(userId, 'test1', 'test2')
      ).rejects.toThrowError(new Forbidden('NO_ACCESS'))
    })
  })

  describe('set Interaction Response', () => {
    it('should return a grant by accept', async () => {
      const result = await grantService.setInteractionResponse(
        userId,
        'test1',
        'test2',
        'accept'
      )
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('client')
      expect(result).toHaveProperty('state')
      expect(result).toMatchObject({
        state: GrantState.Approved
      })
    })
    it('should return a grant by reject', async () => {
      createMockGrantServiceDeps(false, true)
      const result = await grantService.setInteractionResponse(
        userId,
        'test1',
        'test2',
        'reject'
      )
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('client')
      expect(result).toHaveProperty('state')
      expect(result).toMatchObject({
        state: GrantState.Finalized,
        finalizationReason: GrantFinalization.Rejected
      })
    })
  })
})
