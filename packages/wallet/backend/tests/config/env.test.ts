import { envSchema } from '@/config/env'

// The four GateHub URLs have no default value. The schema needs them before it
// runs the telemetry checks.
const BASE = {
  GATEHUB_API_BASE_URL: 'https://api.sandbox.gatehub.net',
  GATEHUB_IFRAME_MANAGED_RAMP_URL: 'https://managed-ramp.sandbox.gatehub.net',
  GATEHUB_IFRAME_EXCHANGE_URL: 'https://exchange.sandbox.gatehub.net',
  GATEHUB_IFRAME_ONBOARDING_URL: 'https://onboarding.sandbox.gatehub.net'
}

describe('env — telemetry', () => {
  const parse = (overrides: Record<string, string>) =>
    envSchema.safeParse({ ...BASE, ...overrides })

  const enabled = {
    TELEMETRY_ENABLED: 'true',
    TELEMETRY_ENDPOINT: 'testnet-wallet-otel-collector:4317',
    TELEMETRY_INSECURE: 'true'
  }

  it('is disabled by default', (): void => {
    const result = parse({})
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      TELEMETRY_ENABLED: false,
      TELEMETRY_ENDPOINT: '',
      TELEMETRY_METRICS_INTERVAL: '15s',
      TELEMETRY_TRACES_SAMPLE_RATIO: 1
    })
  })

  it('accepts an enabled block with an endpoint', (): void => {
    expect(parse(enabled).success).toBe(true)
  })

  it('rejects an enabled block without an endpoint', (): void => {
    const result = parse({ TELEMETRY_ENABLED: 'true' })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.TELEMETRY_ENDPOINT).toEqual([
      'telemetry is enabled, but TELEMETRY_ENDPOINT is not set'
    ])
  })

  it('rejects an endpoint that is a URL', (): void => {
    const result = parse({
      ...enabled,
      TELEMETRY_ENDPOINT: 'http://testnet-wallet-otel-collector:4317'
    })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.TELEMETRY_ENDPOINT).toEqual([
      expect.stringContaining('not a URL')
    ])
  })

  it('rejects a sample ratio above 1', (): void => {
    const result = parse({ ...enabled, TELEMETRY_TRACES_SAMPLE_RATIO: '2' })
    expect(result.success).toBe(false)
    expect(
      result.error?.flatten().fieldErrors.TELEMETRY_TRACES_SAMPLE_RATIO
    ).toHaveLength(1)
  })
})
