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
          const isEnd = time[1].startsWith('P')
          const duration = moment.duration(
            time.find((it) => it.startsWith('P'))
          )
          const date = moment(time.find((it) => it.endsWith('Z')))
          const repetition = time.find((it) => it.startsWith('R'))?.[1]

          if (repetition === '0')
            accessElement.limits!.interval = `${isEnd ? 'Until' : 'From'} ${date.format('MMMM Do YYYY')} with no repetition`
          else if (repetition === undefined)
            accessElement.limits!.interval = `${this.processDuration(duration)} ${isEnd ? 'until' : 'from'} ${date.format('MMMM Do YYYY')}`
          else
            accessElement.limits!.interval = `${repetition} times ${this.processDuration(duration)} ${isEnd ? 'until' : 'from'} ${date.format('MMMM Do YYYY')}`
        }
  }

  private processDuration(duration: moment.Duration) {
    const years = duration.years() !== 0 ? `${duration.years()} years, ` : ''
    const months =
      duration.months() !== 0 ? `${duration.months()} months, ` : ''
    const days = duration.days() !== 0 ? `${duration.days()} days, ` : ''
    const hours = duration.hours() !== 0 ? `${duration.hours()} hours, ` : ''
    const minutes =
      duration.minutes() !== 0 ? `${duration.minutes()} minutes` : ''

    return `Every ${years}${months}${days}${hours}${minutes}`.replace(/, $/, '')
  }
}
