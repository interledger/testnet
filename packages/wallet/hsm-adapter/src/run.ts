import { Code, ConnectError, type Interceptor } from '@connectrpc/connect'
import {
  AtallaClient,
  type AtallaHealthCheckResult,
  type AtallaTransport,
  type AtallaTransportConfig,
  type Logger
} from '@interledger/hsm-atalla-transport'
import { pino } from 'pino'
import { readConfig, type AdapterConfig, type Env, type Role } from './config'

// What createAtallaIssuerServer and createAtallaMerchantServer return.
export interface AdapterServer {
  start(): Promise<void>
  stop(): Promise<void>
  healthCheck(): Promise<AtallaHealthCheckResult>
}

// The wrapper owns the transport. A server given a transport does not connect
// or close it, so the wrapper decides when the HSM connection opens and closes.
export interface ServerConfig {
  grpc: { host: string; port: number }
  transport: AtallaTransport
  interceptors: Interceptor[]
  logger: Logger
}

export type ServerFactory = (config: ServerConfig) => AdapterServer
export type TransportFactory = (
  hsm: AtallaTransportConfig,
  logger: Logger
) => AtallaTransport

const createTransport: TransportFactory = (hsm, logger) =>
  new AtallaClient(hsm, logger)

export interface Process {
  env: Env
  exit(code: number): void
  once(signal: NodeJS.Signals, handler: () => void): void
}

export function createLogger(config: AdapterConfig): Logger {
  // The services log only metadata (rpc name, timing, error message). The
  // redaction is a second line of defence, as in hsm-atalla-server.
  return pino({
    level: config.logLevel,
    base: { adapter: config.role },
    redact: {
      paths: [
        'bdk',
        'ksn',
        'iv',
        'pinBlock',
        'pwk',
        'pan',
        'key',
        'cipherData',
        'dataKeyUnderLmk',
        'pvk',
        'pvv',
        'offset'
      ],
      censor: '[REDACTED]'
    }
  })
}

// Runs one adapter until SIGTERM or SIGINT. The process exits 1 when the
// server does not start, or the HSM does not answer a health check, within
// startTimeoutMs.
export async function main(
  role: Role,
  factory: ServerFactory,
  proc: Process = process,
  makeLogger: (config: AdapterConfig) => Logger = createLogger,
  makeTransport: TransportFactory = createTransport
): Promise<void> {
  let config: AdapterConfig
  let logger: Logger
  try {
    config = readConfig(role, proc.env)
    logger = makeLogger(config)
  } catch (error) {
    console.error(`hsm-adapter-${role}: ${errorMessage(error)}`)
    proc.exit(1)
    return
  }

  const transport = makeTransport(config.hsm, logger)
  const server = factory({
    grpc: config.grpc,
    transport,
    interceptors: [logCalls(logger)],
    logger
  })

  let stopping = false
  const shutdown = (): void => {
    if (stopping) return
    stopping = true
    logger.info({}, 'stopping')
    const stop = async (): Promise<void> => {
      await server.stop()
      await transport.close()
    }
    withTimeout(stop(), config.stopTimeoutMs, 'stop').then(
      () => proc.exit(0),
      (error) => {
        logger.error({ err: errorMessage(error) }, 'stop failed')
        proc.exit(1)
      }
    )
  }
  proc.once('SIGTERM', shutdown)
  proc.once('SIGINT', shutdown)

  try {
    await withTimeout(
      startAndCheck(transport, server),
      config.startTimeoutMs,
      'start'
    )
  } catch (error) {
    if (stopping) return
    logger.error(
      {
        err: errorMessage(error),
        hsm: `${config.hsm.host}:${config.hsm.port}`
      },
      'adapter failed to start'
    )
    // No close(): the transport's close() waits for a connect that may never
    // end. Exiting drops the connection attempt with the process.
    proc.exit(1)
    return
  }

  logger.info(
    {
      endpoint: `${config.grpc.host}:${config.grpc.port}`,
      hsm: `${config.hsm.host}:${config.hsm.port}`
    },
    'gRPC server listening, HSM healthy'
  )
}

// The HSM connection comes first, so the gRPC port opens only once the HSM
// answers. The readiness probe checks that port.
async function startAndCheck(
  transport: AtallaTransport,
  server: AdapterServer
): Promise<void> {
  await transport.connect()
  await server.start()
  const health = await server.healthCheck()
  if (!health.healthy) {
    throw new Error(
      `HSM health check failed: ${health.error ?? health.responseCode ?? 'unknown'}`
    )
  }
}

// Logs each call's Connect code at debug. The library already logs each call
// at info (`hsm rpc ok` / `hsm rpc failed`, with `rpc` and `ms`), but not the
// code the caller sees. Never the request or the response, which carry key
// and card data.
export function logCalls(logger: Logger): Interceptor {
  return (next) => async (request) => {
    const started = performance.now()
    // Connect's Code has no OK; a call that returns is logged as 'OK'.
    const done = (code: string): void => {
      logger.debug(
        {
          rpc: request.method.name,
          ms: Math.round(performance.now() - started),
          code
        },
        'grpc call done'
      )
    }
    try {
      const response = await next(request)
      done('OK')
      return response
    } catch (error) {
      done(Code[ConnectError.from(error).code])
      throw error
    }
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  what: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${what} timed out after ${ms} ms`)),
      ms
    )
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
