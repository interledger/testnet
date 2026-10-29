import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type {
  AtallaTransportConfig,
  TlsMaterial
} from '@interledger/hsm-atalla-transport'
import { parse } from 'yaml'
import { z } from 'zod'

export type Role = 'issuer' | 'merchant'

export const CONFIG_PATH_ENV_VAR = 'HSM_ADAPTER_CONFIG_PATH'

export const DEFAULT_GRPC_PORTS: Record<Role, number> = {
  issuer: 50051,
  merchant: 50052
}

export interface AdapterConfig {
  role: Role
  logLevel: string
  grpc: { host: string; port: number }
  hsm: AtallaTransportConfig
  startTimeoutMs: number
  stopTimeoutMs: number
}

export type Env = Record<string, string | undefined>
export type ReadFile = (path: string) => string

const readUtf8: ReadFile = (path) => readFileSync(path, 'utf8')

const port = z.number().int().min(1).max(65_535)
const positive = z.number().positive()
const path = z.string().trim().min(1)

const configFileSchema = z
  .object({
    log: z
      .object({ level: z.string().trim().min(1).default('info') })
      .strict()
      .default({}),
    grpc: z
      .object({
        host: z.string().trim().min(1).default('0.0.0.0'),
        port: port.optional()
      })
      .strict()
      .default({}),
    atalla: z
      .object({
        host: z.string().trim().min(1),
        port,
        timeout_ms: positive.default(2_000),
        tls: z
          .object({
            enabled: z.boolean().default(false),
            ca_cert_path: path.default('/etc/atalla/tls/ca.crt'),
            client_cert_path: path.default('/etc/atalla/tls/client.crt'),
            client_key_path: path.default('/etc/atalla/tls/client.key'),
            skip_server_identity_check: z.boolean().default(false)
          })
          .strict()
          .default({})
      })
      .strict(),
    start_timeout_ms: positive.default(15_000),
    stop_timeout_ms: positive.default(10_000)
  })
  .strict()

type TlsFileKey = 'ca_cert_path' | 'client_cert_path' | 'client_key_path'

export function readConfig(
  role: Role,
  env: Env = process.env,
  readFile: ReadFile = readUtf8
): AdapterConfig {
  const configPath = env[CONFIG_PATH_ENV_VAR]?.trim()
  if (!configPath) {
    throw new Error(
      `${CONFIG_PATH_ENV_VAR} must be set to the path of a YAML config file`
    )
  }

  let text: string
  try {
    text = readFile(configPath)
  } catch (error) {
    throw new Error(`cannot read ${configPath}: ${errorMessage(error)}`)
  }

  let document: unknown
  try {
    document = parse(text) ?? {}
  } catch (error) {
    throw new Error(`cannot parse ${configPath}: ${errorMessage(error)}`)
  }

  const result = configFileSchema.safeParse(document)
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`
    )
    throw new Error(`invalid ${configPath}: ${problems.join('; ')}`)
  }
  const file = result.data

  return {
    role,
    logLevel: file.log.level,
    grpc: {
      host: file.grpc.host,
      port: file.grpc.port ?? DEFAULT_GRPC_PORTS[role]
    },
    hsm: {
      host: file.atalla.host,
      port: file.atalla.port,
      timeoutMs: file.atalla.timeout_ms,
      poolSize: 1,
      tls: readTls(file.atalla.tls, dirname(configPath), readFile)
    },
    startTimeoutMs: file.start_timeout_ms,
    stopTimeoutMs: file.stop_timeout_ms
  }
}

function readTls(
  tls: z.infer<typeof configFileSchema>['atalla']['tls'],
  baseDir: string,
  readFile: ReadFile
): TlsMaterial | false {
  if (!tls.enabled) return false

  const read = (key: TlsFileKey): string => {
    const file = resolve(baseDir, tls[key])
    try {
      return readFile(file)
    } catch (error) {
      throw new Error(
        `atalla.tls.${key}: cannot read ${file}: ${errorMessage(error)}`
      )
    }
  }

  return {
    ca: read('ca_cert_path'),
    cert: read('client_cert_path'),
    key: read('client_key_path'),
    skipServerIdentityCheck: tls.skip_server_identity_check
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
