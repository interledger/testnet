import { readFileSync } from 'node:fs'
import type {
  AtallaTransportConfig,
  TlsMaterial
} from '@interledger/hsm-atalla-transport'

export type Role = 'issuer' | 'merchant'

export const DEFAULT_GRPC_PORTS: Record<Role, number> = {
  issuer: 50051,
  merchant: 50052
}

export interface AdapterConfig {
  role: Role
  logLevel: string
  grpc: { host: string; port: number }
  hsm: AtallaTransportConfig
  // How long the HSM connection, the listener and the first health check may
  // take. The transport (0.3.0) never gives up on a connection that fails, so
  // the process exits instead and Kubernetes backs off the restart.
  startTimeoutMs: number
  // How long a SIGTERM waits for the server to stop before the process exits.
  stopTimeoutMs: number
}

export type Env = Record<string, string | undefined>
export type ReadFile = (path: string) => string

const readUtf8: ReadFile = (path) => readFileSync(path, 'utf8')

export function readConfig(
  role: Role,
  env: Env = process.env,
  readFile: ReadFile = readUtf8
): AdapterConfig {
  return {
    role,
    logLevel: env.LOG_LEVEL ?? 'info',
    grpc: {
      host: env.GRPC_HOST ?? '0.0.0.0',
      port: readPort(env, 'GRPC_PORT', DEFAULT_GRPC_PORTS[role])
    },
    hsm: {
      host: readRequired(env, 'ATALLA_HOST'),
      port: readPort(env, 'ATALLA_PORT'),
      timeoutMs: readNumber(env, 'ATALLA_TIMEOUT_MS', 2_000),
      // One connection per process. The real HSM accepts two from one public
      // IP: one for the issuer adapter, one for the merchant adapter.
      poolSize: 1,
      tls: readTls(env, readFile)
    },
    startTimeoutMs: readNumber(env, 'START_TIMEOUT_MS', 15_000),
    stopTimeoutMs: readNumber(env, 'STOP_TIMEOUT_MS', 10_000)
  }
}

function readTls(env: Env, readFile: ReadFile): TlsMaterial | false {
  if (!readBoolean(env, 'ATALLA_TLS_ENABLED', false)) return false

  return {
    ca: readTlsFile(
      env,
      readFile,
      'ATALLA_CA_CERT_PATH',
      '/etc/atalla/tls/ca.crt'
    ),
    cert: readTlsFile(
      env,
      readFile,
      'ATALLA_CLIENT_CERT_PATH',
      '/etc/atalla/tls/client.crt'
    ),
    key: readTlsFile(
      env,
      readFile,
      'ATALLA_CLIENT_KEY_PATH',
      '/etc/atalla/tls/client.key'
    ),
    skipServerIdentityCheck: readBoolean(
      env,
      'ATALLA_SKIP_SERVER_IDENTITY_CHECK',
      false
    )
  }
}

function readTlsFile(
  env: Env,
  readFile: ReadFile,
  name: string,
  defaultPath: string
): string {
  const path = env[name] ?? defaultPath
  try {
    return readFile(path)
  } catch (error) {
    throw new Error(`${name}: cannot read ${path}: ${(error as Error).message}`)
  }
}

function readRequired(env: Env, name: string): string {
  const value = env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function readPort(env: Env, name: string, defaultValue?: number): number {
  const value = env[name]
  if (value === undefined) {
    if (defaultValue === undefined) throw new Error(`${name} is required`)
    return defaultValue
  }

  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer between 1 and 65535`)
  }
  return port
}

function readNumber(env: Env, name: string, defaultValue: number): number {
  const value = env[name]
  if (value === undefined) return defaultValue

  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return number
}

function readBoolean(env: Env, name: string, defaultValue: boolean): boolean {
  const value = env[name]
  if (value === undefined) return defaultValue
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`${name} must be true or false`)
}
