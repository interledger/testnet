import { WalletAddressService } from '@/walletAddress/service'
import { BadRequest, Forbidden } from '@shared/backend'
import moment from 'moment'
import { ListUserGrantsArgs } from '@/grant/validation'
import { RhyzaIdpClient } from '@/rhyza/idp-client'
import { RhyzaAdminClient } from '@/rhyza/admin-client'
import {
  AdminGrant,
  GrantAccess,
  GrantClient,
  GrantState as RhyzaGrantState,
  GrantSubjectId,
  Grant as RhyzaGrant
} from '@/rhyza/types'
import {
  GrantResponse,
  GrantsListResponse,
  GrantState,
  GrantFinalization,
  GRANTS_MAX_WALLET_ADDRESSES
} from '@wallet/shared'

interface IGrantService {
  getGrantByInteraction: (
    userId: string,
    grantId: string,
    nonce: string
  ) => Promise<RhyzaGrant>
  setInteractionResponse: (
    userId: string,
    grantId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ) => Promise<void>
  listWithPagination: (
    userId: string,
    args: ListUserGrantsArgs
  ) => Promise<GrantsListResponse>
  getById: (userId: string, grantId: string) => Promise<GrantResponse>
  revoke: (userId: string, grantId: string) => Promise<void>
}

const FINALIZED_STATES: RhyzaGrantState[] = ['ISSUED', 'REJECTED', 'REVOKED']

export class GrantService implements IGrantService {
  constructor(
    private walletAddressService: WalletAddressService,
    private rhyzaIdpClient: RhyzaIdpClient,
    private rhyzaAdminClient: RhyzaAdminClient
  ) {}

  async getGrantByInteraction(
    userId: string,
    grantId: string,
    _nonce: string
  ): Promise<RhyzaGrant> {
    const grant = await this.rhyzaIdpClient.getGrant(grantId)

    if (!(await this.belongsToUser(userId, grant.access, grant.subjectIds))) {
      // reject the grant if the user does not have access
      await this.rhyzaIdpClient.setInteractionResponse(grantId, 'reject')
      throw new Forbidden('NO_ACCESS')
    }

    return grant
  }

  async setInteractionResponse(
    userId: string,
    grantId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ): Promise<void> {
    await this.getGrantByInteraction(userId, grantId, nonce)

    return await this.rhyzaIdpClient.setInteractionResponse(grantId, response)
  }

  async listWithPagination(
    userId: string,
    args: ListUserGrantsArgs
  ): Promise<GrantsListResponse> {
    const walletAddressUrls = await this.getWalletAddressUrls(
      userId,
      args.walletAddressId
    )

    // Paging back needs a cursor
    const backwards = args.direction === 'previous' && !!args.cursor

    const { result, pagination } = await this.rhyzaAdminClient.listGrants({
      walletAddress: walletAddressUrls,
      state: args.state,
      cursor: args.cursor,
      first: backwards ? undefined : args.pageSize,
      last: backwards ? args.pageSize : undefined,
      sortOrder: args.sortOrder === 'ASC' ? 'asc' : 'desc'
    })

    return {
      grants: result.map((grant) => this.toGrantResponse(grant)),
      pageInfo: pagination
    }
  }

  async getById(userId: string, grantId: string): Promise<GrantResponse> {
    const grant = await this.getOwnedGrant(userId, grantId)

    return this.toGrantResponse(grant)
  }

  async revoke(userId: string, grantId: string): Promise<void> {
    await this.getOwnedGrant(userId, grantId)
    await this.rhyzaAdminClient.revokeGrant(grantId)
  }

  // Defaults to all of the user's wallet addresses
  private async getWalletAddressUrls(
    userId: string,
    walletAddressId?: string
  ): Promise<string[]> {
    if (walletAddressId) {
      const walletAddress =
        await this.walletAddressService.getByIdWIthUserDetails(walletAddressId)

      if (!walletAddress?.active || walletAddress.account?.userId !== userId) {
        throw new Forbidden('Invalid wallet address provided')
      }

      return [walletAddress.url]
    }

    const walletAddresses = await this.walletAddressService.listAll(userId)

    if (walletAddresses.length > GRANTS_MAX_WALLET_ADDRESSES) {
      throw new BadRequest('Select a wallet address to see its grants')
    }

    return walletAddresses.map(({ url }) => url)
  }

  private async getOwnedGrant(
    userId: string,
    grantId: string
  ): Promise<AdminGrant> {
    const grant = await this.rhyzaAdminClient.getGrant(grantId)

    if (!(await this.belongsToUser(userId, grant.accesses, grant.subjectIds))) {
      throw new Forbidden('NO_ACCESS')
    }

    return grant
  }

  private async belongsToUser(
    userId: string,
    accesses: GrantAccess[] = [],
    subjectIds: GrantSubjectId[] = []
  ): Promise<boolean> {
    const identifiers = new Set([
      ...accesses.flatMap(({ identifier }) => (identifier ? [identifier] : [])),
      ...subjectIds.map(({ id }) => id)
    ])

    if (!identifiers.size) return false

    const ownershipChecks = await Promise.all(
      [...identifiers].map((identifier) =>
        this.walletAddressService.belongsToUser(userId, identifier)
      )
    )

    return ownershipChecks.every((belongs) => belongs)
  }

  // Legacy shape the grant pages still render
  private toGrantResponse(grant: AdminGrant): GrantResponse {
    const finalized = FINALIZED_STATES.includes(grant.state)

    return {
      id: grant.id,
      client: this.clientName(grant.client),
      state: finalized ? 'FINALIZED' : (grant.state as GrantState),
      finalizationReason: finalized
        ? (grant.state as GrantFinalization)
        : undefined,
      createdAt: grant.createdAt,
      access: (grant.accesses ?? []).map((access, index) => ({
        id: `${grant.id}-${index}`,
        identifier: access.identifier ?? null,
        actions: access.actions,
        type: access.type,
        limits: access.limits
          ? {
              receiver: access.limits.receiver ?? null,
              debitAmount: access.limits.debitAmount ?? null,
              receiveAmount: access.limits.receiveAmount ?? null,
              interval: access.limits.interval ?? null,
              intervalHR: access.limits.interval
                ? this.transformFromIntervalToHR(access.limits.interval)
                : undefined
            }
          : null
      })),
      subject: grant.subjectIds?.length
        ? { sub_ids: grant.subjectIds }
        : undefined
    }
  }

  private clientName(client?: GrantClient): string {
    if (!client) return ''
    if (typeof client === 'string') return client
    if ('walletAddress' in client && client.walletAddress)
      return client.walletAddress
    if ('jwk' in client && client.jwk?.kid) return client.jwk.kid
    if ('kid' in client && client.kid) return client.kid

    return ''
  }

  private transformFromIntervalToHR(interval: string): string | undefined {
    const time = interval.split('/')

    if (time.length !== 3 || !time[0].startsWith('R')) return undefined

    const isEnd = time[1].startsWith('P')
    const durationPart = isEnd ? time[1] : time[2]
    const datePart = isEnd ? time[2] : time[1]

    if (!durationPart.startsWith('P')) return undefined

    // Keep the date as written, offset included
    const date = moment.parseZone(datePart, moment.ISO_8601)

    if (!date.isValid()) return undefined

    const repetition = time[0].slice(1) || undefined
    const units = this.processDuration(durationPart)

    if (!units) return undefined

    if (repetition === '0')
      return `${isEnd ? 'Until' : 'From'} ${date.format('MMMM Do YYYY')} with no repetition`

    if (repetition === undefined)
      return `Every ${units} ${isEnd ? 'until' : 'from'} ${date.format('MMMM Do YYYY')}`

    return `${repetition} ${repetition === '1' ? 'time' : 'times'}, every ${units} ${isEnd ? 'until' : 'from'} ${date.format('MMMM Do YYYY')}`
  }

  // moment.duration would normalise e.g. P365D into months
  private processDuration(duration: string): string | undefined {
    const match = duration.match(
      /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/
    )

    if (!match) return undefined

    const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second']
    const parts = match
      .slice(1)
      .map((value, index) => [Number(value ?? 0), units[index]] as const)
      .filter(([value]) => value !== 0)
      .map(([value, unit]) => `${value} ${unit}${value > 1 ? 's' : ''}`)

    return parts.length ? parts.join(', ') : undefined
  }
}
