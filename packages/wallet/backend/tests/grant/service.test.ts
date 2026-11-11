import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { GrantService } from '@/grant/service'
import { ListUserGrantsArgs } from '@/grant/validation'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { loginUser } from '@/tests/utils'
import { faker } from '@faker-js/faker'
import { truncateTables } from '@shared/backend/tests'
import { mockedListGrant } from '@/tests/mocks'
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

  const walletAddressId = faker.string.uuid()
  const walletAddressUrl = faker.internet.url()
  const pagination = {
    startCursor: 'start',
    endCursor: 'end',
    hasNextPage: true,
    hasPreviousPage: false
  }
  const listArgs: ListUserGrantsArgs = {
    walletAddressId,
    direction: 'next',
    pageSize: 10,
    sortOrder: 'DESC'
  }

  const createMockGrantServiceDeps = (isFailure?: boolean) => {
    const grantServiceDepsMocked = {
      walletAddressService: {
        belongsToUser: () => !isFailure,
        getByIdWIthUserDetails: jest.fn().mockImplementation(async () => ({
          id: walletAddressId,
          url: walletAddressUrl,
          active: true,
          account: { userId: isFailure ? 'someone-else' : userId }
        }))
      },
      rhyzaAdminClient: {
        listGrants: jest
          .fn()
          .mockResolvedValue({ result: mockedListGrant, pagination }),
        getGrant: jest.fn().mockResolvedValue(mockedListGrant[0]),
        revokeGrant: jest.fn()
      },
      rhyzaIdpClient: {
        getGrant: jest.fn().mockResolvedValue({
          id: 'grant',
          state: 'PENDING',
          subjectIds: [],
          access: [
            {
              type: 'outgoing-payment',
              actions: ['create', 'read'],
              identifier: faker.internet.url(),
              limits: {
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
        setInteractionResponse: jest.fn()
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
    it('should accept the interaction', async () => {
      const result = await grantService.setInteractionResponse(
        userId,
        'test1',
        'test2',
        'accept'
      )
      expect(result).toBeUndefined()
      expect(
        Reflect.get(grantService, 'rhyzaIdpClient').setInteractionResponse
      ).toHaveBeenCalledWith('test1', 'accept')
    })
    it('should reject the interaction', async () => {
      const result = await grantService.setInteractionResponse(
        userId,
        'test1',
        'test2',
        'reject'
      )
      expect(result).toBeUndefined()
      expect(
        Reflect.get(grantService, 'rhyzaIdpClient').setInteractionResponse
      ).toHaveBeenCalledWith('test1', 'reject')
    })
  })

  describe('listWithPagination', () => {
    it('lists grants for the wallet address and maps them', async () => {
      const result = await grantService.listWithPagination(userId, listArgs)

      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').listGrants
      ).toHaveBeenCalledWith({
        walletAddress: walletAddressUrl,
        state: undefined,
        cursor: undefined,
        first: 10,
        last: undefined,
        sortOrder: 'desc'
      })
      expect(result.pageInfo).toEqual(pagination)
      expect(result.grants).toHaveLength(2)

      const [approved, rejected] = result.grants
      expect(approved).toMatchObject({
        id: mockedListGrant[0].id,
        state: 'APPROVED',
        finalizationReason: undefined,
        client: (mockedListGrant[0].client as { walletAddress: string })
          .walletAddress
      })
      expect(approved.access[0].limits).toMatchObject({
        receiver: null,
        receiveAmount: null,
        debitAmount: { value: '12425' }
      })
      expect(approved.access[0].limits?.intervalHR).toBeDefined()

      expect(rejected).toMatchObject({
        state: 'FINALIZED',
        finalizationReason: 'REJECTED',
        client: mockedListGrant[1].client,
        subject: { sub_ids: mockedListGrant[1].subjectIds }
      })
      expect(rejected.access[0]).toMatchObject({
        identifier: null,
        limits: null
      })
    })

    it('pages backwards with last and the given cursor', async () => {
      await grantService.listWithPagination(userId, {
        ...listArgs,
        cursor: 'start',
        direction: 'previous',
        state: 'ISSUED',
        sortOrder: 'ASC'
      })

      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').listGrants
      ).toHaveBeenCalledWith({
        walletAddress: walletAddressUrl,
        state: 'ISSUED',
        cursor: 'start',
        first: undefined,
        last: 10,
        sortOrder: 'asc'
      })
    })

    it('pages forward when going back without a cursor', async () => {
      await grantService.listWithPagination(userId, {
        ...listArgs,
        direction: 'previous'
      })

      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').listGrants
      ).toHaveBeenCalledWith(
        expect.objectContaining({ first: 10, last: undefined })
      )
    })

    it.each([
      [
        { kid: 'flat-key', alg: 'EdDSA', kty: 'OKP', crv: 'Ed25519', x: 'x' },
        'flat-key'
      ],
      [{ jwk: { kid: 'wrapped-key' } }, 'wrapped-key'],
      ['https://client.test', 'https://client.test'],
      [{ walletAddress: null, jwk: { kid: 'k1' } }, 'k1']
    ])('names the client %j', async (client, name) => {
      Reflect.get(grantService, 'rhyzaAdminClient').listGrants = jest
        .fn()
        .mockResolvedValue({
          result: [{ ...mockedListGrant[0], client }],
          pagination
        })

      const result = await grantService.listWithPagination(userId, listArgs)
      expect(result.grants[0].client).toBe(name)
    })

    it('falls back to an empty client name for an unknown client shape', async () => {
      Reflect.get(grantService, 'rhyzaAdminClient').listGrants = jest
        .fn()
        .mockResolvedValue({
          result: [{ ...mockedListGrant[0], client: {} }],
          pagination
        })

      const result = await grantService.listWithPagination(userId, listArgs)
      expect(result.grants[0].client).toBe('')
    })

    it.each([
      [
        'R12/2016-08-23T08:00:00Z/P1M',
        '12 times, every 1 month from August 23rd 2016'
      ],
      ['R/P1Y/2026-01-01T00:00:00Z', 'Every 1 year until January 1st 2026'],
      [
        'R/2024-01-01T00:00:00Z/PT30S',
        'Every 30 seconds from January 1st 2024'
      ],
      ['R/2024-01-01T00:00:00Z/PXYZ', undefined],
      ['R/2025-01-01T00:00:00Z/P365D', 'Every 365 days from January 1st 2025'],
      [
        'R3/P1Y2M10DT2H30M/2026-01-01T00:00:00Z',
        '3 times, every 1 year, 2 months, 10 days, 2 hours, 30 minutes until January 1st 2026'
      ],
      [
        'R1/2025-01-01T00:00:00Z/P1M',
        '1 time, every 1 month from January 1st 2025'
      ],
      [
        'R/2025-01-01T00:00:00+02:00/P1M',
        'Every 1 month from January 1st 2025'
      ],
      ['P1M', undefined],
      ['R5/not-a-date/P1M', undefined]
    ])('describes interval %s', async (interval, intervalHR) => {
      Reflect.get(grantService, 'rhyzaAdminClient').listGrants = jest
        .fn()
        .mockResolvedValue({
          result: [
            {
              ...mockedListGrant[0],
              accesses: [
                {
                  type: 'outgoing-payment',
                  actions: ['create'],
                  identifier: walletAddressUrl,
                  limits: { interval }
                }
              ]
            }
          ],
          pagination
        })

      const result = await grantService.listWithPagination(userId, listArgs)
      expect(result.grants[0].access[0].limits).toMatchObject({ interval })
      expect(result.grants[0].access[0].limits?.intervalHR).toBe(intervalHR)
    })

    it('fails if the wallet address is inactive', async () => {
      Reflect.get(
        grantService,
        'walletAddressService'
      ).getByIdWIthUserDetails.mockResolvedValueOnce({
        id: walletAddressId,
        url: walletAddressUrl,
        active: false,
        account: { userId }
      })
      await expect(
        grantService.listWithPagination(userId, listArgs)
      ).rejects.toThrowError(/Invalid wallet address provided/)
    })

    it('fails if the wallet address does not belong to the user', async () => {
      createMockGrantServiceDeps(true)
      await expect(
        grantService.listWithPagination(userId, listArgs)
      ).rejects.toThrowError(/Invalid wallet address provided/)
      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').listGrants
      ).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('returns the mapped grant', async () => {
      const result = await grantService.getById(userId, mockedListGrant[0].id)
      expect(result).toMatchObject({ id: mockedListGrant[0].id })
    })

    it('fails if the grant does not belong to the user', async () => {
      createMockGrantServiceDeps(true)
      await expect(
        grantService.getById(userId, mockedListGrant[0].id)
      ).rejects.toThrowError(new Forbidden('NO_ACCESS'))
    })
  })

  describe('ownership check', () => {
    it('checks every access identifier and subject id', async () => {
      const ownWallet = faker.internet.url()
      const otherWallet = faker.internet.url()
      const belongsToUser = jest.fn(
        async (_userId: string, url: string) => url === ownWallet
      )
      Reflect.get(grantService, 'walletAddressService').belongsToUser =
        belongsToUser
      Reflect.get(grantService, 'rhyzaAdminClient').getGrant = jest
        .fn()
        .mockResolvedValue({
          ...mockedListGrant[0],
          accesses: [
            {
              type: 'incoming-payment',
              actions: ['read'],
              identifier: ownWallet
            },
            {
              type: 'outgoing-payment',
              actions: ['create'],
              identifier: otherWallet
            }
          ]
        })

      await expect(
        grantService.revoke(userId, mockedListGrant[0].id)
      ).rejects.toThrowError(new Forbidden('NO_ACCESS'))
      expect(belongsToUser).toHaveBeenCalledWith(userId, otherWallet)
      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').revokeGrant
      ).not.toHaveBeenCalled()
    })
  })

  describe('revoke', () => {
    it('revokes the grant', async () => {
      await grantService.revoke(userId, mockedListGrant[0].id)
      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').revokeGrant
      ).toHaveBeenCalledWith(mockedListGrant[0].id)
    })

    it('does not revoke a grant the user does not own', async () => {
      createMockGrantServiceDeps(true)
      await expect(
        grantService.revoke(userId, mockedListGrant[0].id)
      ).rejects.toThrowError(new Forbidden('NO_ACCESS'))
      expect(
        Reflect.get(grantService, 'rhyzaAdminClient').revokeGrant
      ).not.toHaveBeenCalled()
    })
  })
})
