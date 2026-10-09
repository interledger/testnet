import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { envSchema } from '@/config/env'

const CERT =
  '-----BEGIN CERTIFICATE-----\nMIIBdummy\n-----END CERTIFICATE-----\n'

// The four GateHub URLs have no default value. The schema needs them before it
// runs the HSM checks.
const BASE = {
  GATEHUB_API_BASE_URL: 'https://api.sandbox.gatehub.net',
  GATEHUB_IFRAME_MANAGED_RAMP_URL: 'https://managed-ramp.sandbox.gatehub.net',
  GATEHUB_IFRAME_EXCHANGE_URL: 'https://exchange.sandbox.gatehub.net',
  GATEHUB_IFRAME_ONBOARDING_URL: 'https://onboarding.sandbox.gatehub.net'
}

type TlsField =
  | 'ATALLA_CA_CERT_PATH'
  | 'ATALLA_CLIENT_CERT_PATH'
  | 'ATALLA_CLIENT_KEY_PATH'

const TLS_FIELDS: TlsField[] = [
  'ATALLA_CA_CERT_PATH',
  'ATALLA_CLIENT_CERT_PATH',
  'ATALLA_CLIENT_KEY_PATH'
]

describe('env — Atalla TLS paths', () => {
  let dir: string
  let ca: string
  let cert: string
  let key: string

  beforeEach((): void => {
    dir = mkdtempSync(join(tmpdir(), 'atalla-env-'))
    ca = join(dir, 'ca.crt')
    cert = join(dir, 'client.crt')
    key = join(dir, 'client.key')
    for (const path of [ca, cert, key]) writeFileSync(path, CERT)
  })

  afterEach((): void => {
    rmSync(dir, { recursive: true, force: true })
  })

  const parse = (overrides: Record<string, string>) =>
    envSchema.safeParse({ ...BASE, ...overrides })

  const errorsFor = (
    overrides: Record<string, string>,
    field: TlsField
  ): string[] => {
    const result = parse(overrides)
    if (result.success) return []
    return result.error.flatten().fieldErrors[field] ?? []
  }

  const hsmOn = {
    HSM_ENABLED: 'true',
    ATALLA_HOST: 'atalla.internal',
    ATALLA_PORT: '1111'
  }

  it('does not require the paths when the HSM is disabled', (): void => {
    expect(parse({ HSM_ENABLED: 'false' }).success).toBe(true)
  })

  it('does not require the paths when TLS is disabled', (): void => {
    expect(parse({ ...hsmOn, ATALLA_TLS_ENABLED: 'false' }).success).toBe(true)
  })

  it('accepts paths that point at readable PEM files', (): void => {
    const result = parse({
      ...hsmOn,
      ATALLA_CA_CERT_PATH: ca,
      ATALLA_CLIENT_CERT_PATH: cert,
      ATALLA_CLIENT_KEY_PATH: key
    })

    expect(result.success).toBe(true)
  })

  it('requires all three paths when the HSM and TLS are enabled', (): void => {
    const result = parse(hsmOn)
    expect(result.success).toBe(false)

    for (const field of TLS_FIELDS) {
      expect(errorsFor(hsmOn, field)).toEqual([
        `${field} is required when HSM_ENABLED=true and ATALLA_TLS_ENABLED=true`
      ])
    }
  })

  it('rejects a path that does not exist', (): void => {
    const absent = join(dir, 'absent.crt')
    const errors = errorsFor(
      {
        ...hsmOn,
        ATALLA_CA_CERT_PATH: absent,
        ATALLA_CLIENT_CERT_PATH: cert,
        ATALLA_CLIENT_KEY_PATH: key
      },
      'ATALLA_CA_CERT_PATH'
    )

    expect(errors).toEqual([`file does not exist (${absent})`])
  })

  it('rejects a file that is not PEM', (): void => {
    writeFileSync(cert, 'this is not a certificate')
    const errors = errorsFor(
      {
        ...hsmOn,
        ATALLA_CA_CERT_PATH: ca,
        ATALLA_CLIENT_CERT_PATH: cert,
        ATALLA_CLIENT_KEY_PATH: key
      },
      'ATALLA_CLIENT_CERT_PATH'
    )

    expect(errors).toEqual([
      `file is not PEM: no "-----BEGIN" line found (${cert})`
    ])
  })

  it('reports every unusable path at once, not just the first', (): void => {
    const overrides = {
      ...hsmOn,
      ATALLA_CA_CERT_PATH: join(dir, 'absent-ca.crt'),
      ATALLA_CLIENT_CERT_PATH: join(dir, 'absent-cert.crt'),
      ATALLA_CLIENT_KEY_PATH: key
    }

    expect(parse(overrides).success).toBe(false)
    expect(errorsFor(overrides, 'ATALLA_CA_CERT_PATH')).toHaveLength(1)
    expect(errorsFor(overrides, 'ATALLA_CLIENT_CERT_PATH')).toHaveLength(1)
    expect(errorsFor(overrides, 'ATALLA_CLIENT_KEY_PATH')).toHaveLength(0)
  })
})

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

  it('checks telemetry when the HSM is disabled', (): void => {
    const result = parse({ ...enabled, TELEMETRY_TRACES_SAMPLE_RATIO: '2' })
    expect(result.success).toBe(false)
    expect(
      result.error?.flatten().fieldErrors.TELEMETRY_TRACES_SAMPLE_RATIO
    ).toHaveLength(1)
  })
})
