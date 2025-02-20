import {
  Access,
  GetGrantsQueryVariables,
  Grant
} from '@/rafiki/auth/generated/graphql'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { WalletAddressService } from '@/walletAddress/service'
import { BadRequest, Forbidden } from '@shared/backend'
import moment from 'moment'
import { AxiosError } from 'axios'
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

    try {
      return await this.rafikiAuthService.setInteractionResponse(
        interactionId,
        nonce,
        response
      )
    } catch (e) {
      if (e instanceof AxiosError && e.response?.data === 'Bad Request') {
        throw new BadRequest('Invalid interaction')
      }

      throw e
    }
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
      args.filter.identifier = { in: identifiers }
    }

    const grants = await this.rafikiAuthService.listGrantsWithPagination(args)
    grants.grants.edges.forEach((edge) => {
      edge.node.access = this.parseIntervals(edge.node.access)
    })
    return grants
  }

  private parseIntervals(access: Access[]): Access[] {
    return access.map((accessElement) => {
      if (accessElement.limits?.interval) {
        return {
          ...accessElement,
          limits: {
            ...accessElement.limits,
            intervalHR: this.transformFromIntervalToHR(
              accessElement.limits.interval
            )
          }
        }
      }
      return accessElement
    })
  }

  private transformFromIntervalToHR(interval: string): string {
    const time = interval.split('/')
    const isEnd = time[1].startsWith('P')
    const duration = moment.duration(time.find((it) => it.startsWith('P')))
    const date = moment(time.find((it) => it.endsWith('Z')))
    const repetition = time.find((it) => it.startsWith('R'))?.[1]

    if (repetition === '0')
      return `${isEnd ? 'Until' : 'From'} ${date.format('MMMM Do YYYY')} with no repetition`

    if (repetition === undefined)
      return `${this.processDuration(duration)} ${isEnd ? 'until' : 'from'} ${date.format('MMMM Do YYYY')}`

    return `${repetition} times ${this.processDuration(duration)} ${isEnd ? 'until' : 'from'} ${date.format('MMMM Do YYYY')}`
  }
  private processDuration(duration: moment.Duration) {
    const years =
      duration.years() !== 0
        ? `${duration.years()} ${duration.years() > 1 ? 'years' : 'year'}, `
        : ''
    const months =
      duration.months() !== 0
        ? `${duration.months()} ${duration.months() > 1 ? 'months' : 'month'}, `
        : ''
    const days =
      duration.days() !== 0
        ? `${duration.days()} ${duration.days() > 1 ? 'days' : 'day'}, `
        : ''
    const hours =
      duration.hours() !== 0
        ? `${duration.hours()} ${duration.hours() > 1 ? 'hours' : 'hour'}, `
        : ''
    const minutes =
      duration.minutes() !== 0
        ? `${duration.minutes()} ${duration.minutes() > 1 ? 'minutes' : 'minute'}`
        : ''

    return `Every ${years}${months}${days}${hours}${minutes}`.replace(/, $/, '')
  }
}
