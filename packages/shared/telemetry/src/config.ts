import { z } from 'zod'

// The same settings as the `telemetry:` block of merchant-api and issuer-api,
// read from environment variables. The Helm chart sets them, and fills in
// TELEMETRY_ENDPOINT with the release's own collector when it is left empty.

// An empty variable means "not set". Without this, z.coerce.number() would
// read TELEMETRY_TRACES_SAMPLE_RATIO= as 0 and silently sample nothing.
const emptyAsUnset = (value: unknown) => (value === '' ? undefined : value)

const booleanString = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true')

const DURATION = /^(\d+(?:\.\d+)?)(ms|s|m)$/
const DURATION_UNIT_MS = { ms: 1, s: 1000, m: 60_000 } as const

// Takes the Go duration subset the charts use: "500ms", "15s", "1m".
export function parseDuration(value: string): number | undefined {
  const match = DURATION.exec(value.trim())
  if (!match) return undefined
  const unit = match[2] as keyof typeof DURATION_UNIT_MS
  return Number(match[1]) * DURATION_UNIT_MS[unit]
}

export const telemetryEnvShape = {
  TELEMETRY_ENABLED: booleanString('false'),
  // A gRPC target, `host:port`. Not a URL.
  TELEMETRY_ENDPOINT: z.string().trim().default(''),
  TELEMETRY_INSECURE: booleanString('false'),
  TELEMETRY_TRACES_ENABLED: booleanString('true'),
  TELEMETRY_TRACES_SAMPLE_RATIO: z.preprocess(
    emptyAsUnset,
    z.coerce.number().default(1)
  ),
  TELEMETRY_METRICS_ENABLED: booleanString('true'),
  TELEMETRY_METRICS_INTERVAL: z.string().default('15s'),
  SERVICE_NAME: z.string().trim().optional(),
  SERVICE_VERSION: z.string().trim().default(''),
  SERVICE_ENV: z.string().trim().default('dev')
}

const telemetryEnvSchema = z.object(telemetryEnvShape)

export type TelemetryEnv = z.infer<typeof telemetryEnvSchema>

// A gRPC target here is `host:port` or `[ipv6]:port`. The exporter adds the
// scheme from TELEMETRY_INSECURE. An http(s) URL is the usual mistake,
// because the OTEL_* variables take one.
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
const HOST_PORT = /^(?:\[[0-9a-f:.]+\]|[^\s/:[\]]+):\d{1,5}$/i

function telemetryIssues(
  env: TelemetryEnv
): { path: string; message: string }[] {
  // A disabled block is not checked, the same as in merchant-api.
  if (!env.TELEMETRY_ENABLED) return []

  const issues: { path: string; message: string }[] = []

  if (!env.TELEMETRY_TRACES_ENABLED && !env.TELEMETRY_METRICS_ENABLED) {
    issues.push({
      path: 'TELEMETRY_ENABLED',
      message:
        'telemetry is enabled, but TELEMETRY_TRACES_ENABLED and TELEMETRY_METRICS_ENABLED are both false'
    })
  }

  const endpoint = env.TELEMETRY_ENDPOINT
  if (!endpoint) {
    issues.push({
      path: 'TELEMETRY_ENDPOINT',
      message: 'telemetry is enabled, but TELEMETRY_ENDPOINT is not set'
    })
  } else if (URL_SCHEME.test(endpoint)) {
    issues.push({
      path: 'TELEMETRY_ENDPOINT',
      message: `TELEMETRY_ENDPOINT must be a gRPC target (host:port), not a URL: ${endpoint}`
    })
  } else if (!HOST_PORT.test(endpoint)) {
    issues.push({
      path: 'TELEMETRY_ENDPOINT',
      message: `TELEMETRY_ENDPOINT must be a gRPC target (host:port): ${endpoint}`
    })
  }

  const ratio = env.TELEMETRY_TRACES_SAMPLE_RATIO
  if (Number.isNaN(ratio) || ratio < 0 || ratio > 1) {
    issues.push({
      path: 'TELEMETRY_TRACES_SAMPLE_RATIO',
      message: `TELEMETRY_TRACES_SAMPLE_RATIO must be between 0 and 1: ${ratio}`
    })
  }

  const interval = parseDuration(env.TELEMETRY_METRICS_INTERVAL)
  if (interval === undefined || interval <= 0) {
    issues.push({
      path: 'TELEMETRY_METRICS_INTERVAL',
      message: `TELEMETRY_METRICS_INTERVAL must be a duration greater than 0, such as 15s: ${env.TELEMETRY_METRICS_INTERVAL}`
    })
  }

  return issues
}

// For a schema that spreads `telemetryEnvShape` into its own object, such as
// the wallet backend's env.ts. Call it from that schema's superRefine.
export function refineTelemetryEnv(env: TelemetryEnv, ctx: z.RefinementCtx) {
  for (const issue of telemetryIssues(env)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [issue.path],
      message: issue.message
    })
  }
}

export interface TelemetryConfig {
  enabled: boolean
  // Always `host:port`.
  endpoint: string
  insecure: boolean
  traces: { enabled: boolean; sampleRatio: number }
  metrics: { enabled: boolean; intervalMillis: number }
  service: { name: string; version: string; env: string }
}

export interface TelemetryDefaults {
  serviceName: string
}

// Expects an env that has passed refineTelemetryEnv.
export function telemetryConfigFromEnv(
  env: TelemetryEnv,
  defaults: TelemetryDefaults
): TelemetryConfig {
  return {
    enabled: env.TELEMETRY_ENABLED,
    endpoint: env.TELEMETRY_ENDPOINT,
    insecure: env.TELEMETRY_INSECURE,
    traces: {
      enabled: env.TELEMETRY_TRACES_ENABLED,
      sampleRatio: env.TELEMETRY_TRACES_SAMPLE_RATIO
    },
    metrics: {
      enabled: env.TELEMETRY_METRICS_ENABLED,
      intervalMillis: parseDuration(env.TELEMETRY_METRICS_INTERVAL) ?? 15_000
    },
    service: {
      name: env.SERVICE_NAME || defaults.serviceName,
      version: env.SERVICE_VERSION,
      env: env.SERVICE_ENV
    }
  }
}

// Parses and checks the telemetry variables on their own. Throws with every
// problem in one message.
export function parseTelemetryEnv(
  processEnv: NodeJS.ProcessEnv,
  defaults: TelemetryDefaults
): TelemetryConfig {
  const result = telemetryEnvSchema
    .superRefine(refineTelemetryEnv)
    .safeParse(processEnv)

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`invalid telemetry configuration: ${problems}`)
  }

  return telemetryConfigFromEnv(result.data, defaults)
}
