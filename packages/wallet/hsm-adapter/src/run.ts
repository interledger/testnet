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

export interface AdapterServer {
  start(): Promise<void>
  stop(): Promise<void>
  healthCheck(): Promise<AtallaHealthCheckResult>
}

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

export function logCalls(logger: Logger): Interceptor {
  return (next) => async (request) => {
    const started = performance.now()
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
