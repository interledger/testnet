import { AsyncLocalStorage } from 'node:async_hooks'
import { toJson } from '@bufbuild/protobuf'
import { Code, ConnectError, type Interceptor } from '@connectrpc/connect'
import {
  AtallaClient,
  type AtallaHealthCheckResult,
  type AtallaTransport,
  type AtallaTransportConfig,
  type Logger
} from '@interledger/hsm-atalla-transport'
import { pino, type DestinationStream } from 'pino'
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

const callContext = new AsyncLocalStorage<{ request_id?: string }>()

export function createLogger(
  config: AdapterConfig,
  destination?: DestinationStream
): Logger {
  return pino(
    {
      level: config.logLevel,
      base: { adapter: config.role },
      mixin: () => callContext.getStore() ?? {},
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
    },
    destination
  )
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
    interceptors: [logCalls(logger, config.logPayloads)],
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

export function logCalls(logger: Logger, logPayloads = false): Interceptor {
  return (next) => async (request) => {
    const requestId = request.header.get('x-request-id')
    const context = requestId === null ? {} : { request_id: requestId }
    const started = performance.now()
    const done = (code: string, payload: object): void => {
      logger.debug(
        {
          ...context,
          rpc: request.method.name,
          ms: Math.round(performance.now() - started),
          code,
          ...payload
        },
        'grpc call done'
      )
    }
    if (logPayloads && !request.stream) {
      logger.debug(
        {
          ...context,
          rpc: request.method.name,
          request: toJson(request.method.input, request.message)
        },
        'grpc call start'
      )
    }
    try {
      const response = await callContext.run(context, () => next(request))
      done(
        'OK',
        logPayloads && !response.stream
          ? { response: toJson(response.method.output, response.message) }
          : {}
      )
      return response
    } catch (error) {
      const connectError = ConnectError.from(error)
      done(
        Code[connectError.code],
        logPayloads ? { err: connectError.rawMessage } : {}
      )
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
