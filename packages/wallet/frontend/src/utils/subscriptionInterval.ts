type BillingInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

type IntervalDisplay = {
  label: string
  startsAt?: string
  raw?: string
}

const BILLING_INTERVAL_BY_DURATION_UNIT: Record<string, BillingInterval> = {
  D: 'DAY',
  W: 'WEEK',
  M: 'MONTH',
  Y: 'YEAR'
}

const formatCountedInterval = (
  billingInterval?: BillingInterval,
  billingIntervalCount?: number
): string => {
  if (!billingInterval || !billingIntervalCount) {
    return '-'
  }

  const interval = billingInterval.toLowerCase()

  if (billingIntervalCount === 1) {
    return `Every ${interval}`
  }

  return `Every ${billingIntervalCount} ${interval}s`
}

const parseGrantInterval = (grantInterval?: string) => {
  if (!grantInterval) {
    return undefined
  }

  const match = /^R(?:\d+)?\/([^/]+)\/P(\d+)([DWMY])$/.exec(grantInterval)

  if (!match) {
    return undefined
  }

  const [, startsAt, count, unit] = match
  const billingInterval = BILLING_INTERVAL_BY_DURATION_UNIT[unit]

  if (!billingInterval || Number.isNaN(new Date(startsAt).getTime())) {
    return undefined
  }

  return {
    startsAt,
    billingInterval,
    billingIntervalCount: Number(count)
  }
}

export const getSubscriptionIntervalDisplay = (params: {
  grantInterval?: string
  billingInterval?: BillingInterval
  billingIntervalCount?: number
}): IntervalDisplay => {
  const parsedGrantInterval = parseGrantInterval(params.grantInterval)

  if (parsedGrantInterval) {
    return {
      label: formatCountedInterval(
        parsedGrantInterval.billingInterval,
        parsedGrantInterval.billingIntervalCount
      ),
      startsAt: parsedGrantInterval.startsAt,
      raw: params.grantInterval
    }
  }

  return {
    label: formatCountedInterval(
      params.billingInterval,
      params.billingIntervalCount
    ),
    raw: params.grantInterval
  }
}