import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { GrantService } from '@/grant/service'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { loginUser } from '@/tests/utils'
import { faker } from '@faker-js/faker'
import { truncateTables } from '@shared/backend/tests'
import { mockedListGrant } from '@/tests/mocks'
import { GrantFinalization, GrantState } from '@/rafiki/auth/generated/graphql'
import { AwilixContainer } from 'awilix'
import { Forbidden } from '@shared/backend'

describe('Grant Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let grantService: GrantService
  let userId: string

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    grantService = await bindings.resolve('grantService')

    createMockGrantServiceDeps()
  })

  const identifiers = ['test', 'wallet', 'new']
  const createMockGrantServiceDeps = (
    isFailure?: boolean,
    IsGrantInteractionRejected?: boolean
  ) => {
    const grantServiceDepsMocked = {
      walletAddressService: {
        belongsToUser: () => !isFailure,
        listIdentifiersByUserId: () => identifiers
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
          access: [
            {
              identifier: faker.internet.url(),
              limits: {
                receiver: null,
                debitAmount: {
                  value: '12425',
                  assetCode: 'USD',
                  assetScale: 2
                },
                receiveAmount: {
                  value: '12300',
                  assetCode: 'USD',
                  assetScale: 2
                },
                interval: 'R/2016-08-23T08:00:00Z/P1M'
              }
            }
          ]
        }),
        listGrants: jest.fn().mockReturnValue(mockedListGrant),
        listGrantsWithPagination: jest.fn().mockReturnValue({
          grants: {
            edges: JSON.parse(
              JSON.stringify(mockedListGrant.map((grant) => ({ node: grant })))
            ),
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        })
      }
    }

    for (const key in grantServiceDepsMocked)
      Reflect.set(
        grantService,
        key,
        grantServiceDepsMocked[key as keyof typeof grantServiceDepsMocked]
      )
  }

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

  describe('list', () => {
    it('should return grants list', async () => {
      const result = await grantService.list(userId)
      expect(result.length).toBe(2)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('client')
      expect(result[0]).toHaveProperty('state')
      expect(result[0]).toMatchObject({
        state: GrantState.Approved
      })
    })
  })

  describe('listWithPagination', () => {
    it('should return grants list', async () => {
      const result = await grantService.listWithPagination(userId, {})
      expect(result.grants.edges.length).toBe(2)
      expect(result.grants.pageInfo).toMatchObject({
        hasNextPage: false,
        hasPreviousPage: false
      })
    })

    it('should accept identifier filter', async () => {
      const result = await grantService.listWithPagination(userId, {
        filter: { identifier: { in: [identifiers[0], identifiers[1]] } }
      })
      expect(result.grants.edges.length).toBe(2)
      expect(result.grants.pageInfo).toMatchObject({
        hasNextPage: false,
        hasPreviousPage: false
      })
    })

    it('should fail if identifier does not belong to user', async () => {
      await expect(
        grantService.listWithPagination(userId, {
          filter: { identifier: { in: [identifiers[0], 'fakeid'] } }
        })
      ).rejects.toThrowError(/Invalid identifiers provided/)
    })
  })
})
