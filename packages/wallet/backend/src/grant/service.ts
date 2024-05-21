import { GetGrantsQueryVariables, Grant } from '@/rafiki/auth/generated/graphql'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { WalletAddressService } from '@/walletAddress/service'
import { Forbidden } from '@shared/backend'
import moment from 'moment'
interface IGrantService {
  getGrantByInteraction: (
    userId: string,
    interactionId: string,
    nonce: string
  ) => Promise<Grant>
  setInteractionResponse: (
    userId: string,
    interactionId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ) => Promise<Grant>
}

export class GrantService implements IGrantService {
  constructor(
    private rafikiAuthService: RafikiAuthService,
    private walletAddressService: WalletAddressService
  ) {}

  async getGrantByInteraction(
    userId: string,
    interactionId: string,
    nonce: string
  ): Promise<Grant> {
    const grant: Grant = await this.rafikiAuthService.getGrantByInteraction(
      interactionId,
      nonce
    )

    const url = grant.access.find(({ identifier }) => identifier)?.identifier

    if (!url || !(await this.walletAddressService.belongsToUser(userId, url))) {
      throw new Forbidden('NO_ACCESS')
    }

    return grant
  }

  async setInteractionResponse(
    userId: string,
    interactionId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ): Promise<Grant> {
    await this.getGrantByInteraction(userId, interactionId, nonce)

    return await this.rafikiAuthService.setInteractionResponse(
      interactionId,
      nonce,
      response
    )
  }

  async list(userId: string) {
    const identifiers =
      await this.walletAddressService.listIdentifiersByUserId(userId)
    return await this.rafikiAuthService.listGrants(identifiers)
  }

  async listWithPagination(userId: string, args: GetGrantsQueryVariables) {
    const identifiers =
      await this.walletAddressService.listIdentifiersByUserId(userId)

    if (args.filter?.identifier?.in) {
      const identifiersBelongToUser = args.filter?.identifier?.in.every(
        (identifier) => identifiers.includes(identifier)
      )

      if (!identifiersBelongToUser) {
        throw new Forbidden('Invalid identifiers provided')
      }
    } else {
      args.filter = args.filter ?? {}
      args.filter = { identifier: { in: identifiers } }
    }

    const grants = await this.rafikiAuthService.listGrantsWithPagination(args)
    this.parseIntervals(grants.grants.edges.map((it) => it.node))
    return grants
  }

  private parseIntervals(grants: Grant[]) {
    for (const grant of grants)
      for (const accessElement of grant.access)
        if (accessElement.limits?.interval) {
          const time = accessElement.limits?.interval.split('/')
          const duration = moment.duration(time[2])
          const date = moment(time[1])
          const months = duration.asMonths()
          if (months === 1)
            accessElement.limits!.interval = `every month from ${date.format('ddd')}`
          else if (months > 1 && months < 12)
            accessElement.limits!.interval = `every ${months} month from ${date.format('ddd')}`
          else if (months === 12)
            accessElement.limits!.interval = `every year from ${date.format('ddd')}`
          else if (months > 12) {
            const years = duration.asYears()
            accessElement.limits!.interval = `every ${years} year from ${date.format('ddd')}`
          } else if (months < 1 && months > 0) {
            const days = duration.asDays()
            accessElement.limits!.interval = `every ${days} days from ${date.format('ddd')}`
          }
        }
  }
}
