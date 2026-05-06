import { Order } from '@/order/model'
import { BillingInterval, Product } from '@/product/model'
import { BaseModel } from '@shared/backend'
import { Model } from 'objection'

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED'
}

export class Subscription extends BaseModel {
  static tableName = 'subscriptions'

  public id!: string
  public productId!: string
  public quantity!: number
  public amount!: number
  public currency!: string
  public grantInterval?: string
  public walletAddress!: string
  public currentPeriodNumber!: number
  public totalPayments?: number
  public continueUri!: string
  public continueToken!: string
  public interactNonce!: string
  public clientNonce!: string
  public accessToken?: string
  public manageUrl?: string
  public status!: SubscriptionStatus
  public nextBillingAt?: Date | null
  public retryCount!: number
  public latestOrderId?: string
  public canceledAt?: Date
  public product!: Product
  public latestOrder?: Order

  static relationMappings = () => ({
    product: {
      relation: Model.BelongsToOneRelation,
      modelClass: Product,
      join: {
        from: 'subscriptions.productId',
        to: 'products.id'
      }
    },

    latestOrder: {
      relation: Model.BelongsToOneRelation,
      modelClass: Order,
      join: {
        from: 'subscriptions.latestOrderId',
        to: 'orders.id'
      }
    }
  })
}

const GRANT_INTERVAL_UNIT_BY_BILLING_INTERVAL: Record<BillingInterval, string> = {
  [BillingInterval.DAY]: 'D',
  [BillingInterval.WEEK]: 'W',
  [BillingInterval.MONTH]: 'M',
  [BillingInterval.YEAR]: 'Y'
}

const BILLING_INTERVAL_BY_GRANT_INTERVAL_UNIT: Record<string, BillingInterval> = {
  D: BillingInterval.DAY,
  W: BillingInterval.WEEK,
  M: BillingInterval.MONTH,
  Y: BillingInterval.YEAR
}

interface ParsedGrantInterval {
  startsAt: Date
  repeats: number | null
  billingInterval: BillingInterval
  billingIntervalCount: number
}

export function buildGrantInterval(
  startsAt: Date,
  interval: BillingInterval,
  count: number,
  repeats?: number
): string {
  const formattedStartAt = startsAt.toISOString().replace(/\.\d{3}Z$/, 'Z')

  return `R${repeats ?? ''}/${formattedStartAt}/P${count}${GRANT_INTERVAL_UNIT_BY_BILLING_INTERVAL[interval]}`
}

function parseGrantInterval(grantInterval?: string): ParsedGrantInterval | undefined {
  if (!grantInterval) {
    return undefined
  }

  const match = /^R(?:(\d+))?\/([^/]+)\/P(\d+)([DWMY])$/.exec(grantInterval)

  if (!match) {
    return undefined
  }

  const [, repeats, startsAt, count, unit] = match
  const billingInterval = BILLING_INTERVAL_BY_GRANT_INTERVAL_UNIT[unit]
  const parsedStartAt = new Date(startsAt)

  if (!billingInterval || Number.isNaN(parsedStartAt.getTime())) {
    return undefined
  }

  return {
    startsAt: parsedStartAt,
    repeats: repeats ? Number(repeats) : null,
    billingInterval,
    billingIntervalCount: Number(count)
  }
}

function addBillingInterval(
  value: Date,
  interval: BillingInterval,
  count: number
): Date {
  const next = new Date(value)

  switch (interval) {
    case BillingInterval.DAY:
      next.setDate(next.getDate() + count)
      return next
    case BillingInterval.WEEK:
      next.setDate(next.getDate() + count * 7)
      return next
    case BillingInterval.MONTH:
      next.setMonth(next.getMonth() + count)
      return next
    case BillingInterval.YEAR:
      next.setFullYear(next.getFullYear() + count)
      return next
    default:
      return next
  }
}

export function getNextBillingDateFromGrantInterval(
  grantInterval: string,
  now: Date
): Date | undefined {
  const parsedGrantInterval = parseGrantInterval(grantInterval)

  if (!parsedGrantInterval) {
    return undefined
  }

  const { billingInterval, billingIntervalCount, repeats, startsAt } =
    parsedGrantInterval

  let next = new Date(startsAt)
  let emittedIntervals = 0

  while (next <= now) {
    emittedIntervals += 1

    if (repeats !== null && emittedIntervals >= repeats) {
      return undefined
    }

    next = addBillingInterval(next, billingInterval, billingIntervalCount)
  }

  return next
}

export function getNextBillingDate(
  now: Date,
  interval: BillingInterval,
  count: number
): Date {
  const next = new Date(now)

  switch (interval) {
    case BillingInterval.DAY:
      next.setDate(next.getDate() + count)
      return next
    case BillingInterval.WEEK:
      next.setDate(next.getDate() + count * 7)
      return next
    case BillingInterval.MONTH:
      next.setMonth(next.getMonth() + count)
      return next
    case BillingInterval.YEAR:
      next.setFullYear(next.getFullYear() + count)
      return next
    default:
      return next
  }
}
