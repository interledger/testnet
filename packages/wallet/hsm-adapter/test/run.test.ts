import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Code, ConnectError } from '@connectrpc/connect'
import type {
  AtallaHealthCheckResult,
  AtallaResponse,
  AtallaTransport,
  AtallaTransportConfig,
  Logger
} from '@interledger/hsm-atalla-transport'
import {
  createLogger,
  logCalls,
  main,
  withTimeout,
  type AdapterServer,
  type Process,
  type ServerConfig
} from '../src/run'
import { readConfig } from '../src/config'

const env = {
  ATALLA_HOST: 'atalla-hsm',
  ATALLA_PORT: '13506',
  START_TIMEOUT_MS: '50',
  STOP_TIMEOUT_MS: '50'
}

const never = new Promise<never>(() => {})

// Records the order of lifecycle calls across the transport and the server.
type Calls = string[]

class FakeTransport implements AtallaTransport {
  constructor(
    private readonly calls: Calls,
    private readonly connectResult: () => Promise<void> = async () => {}
  ) {}

  connect(): Promise<void> {
    this.calls.push('connect')
    return this.connectResult()
  }

  async close(): Promise<void> {
    this.calls.push('close')
  }

  async request(): Promise<AtallaResponse> {
    throw new Error('not used')
  }
}

class FakeServer implements AdapterServer {
  stopped = false
  started = false
  calls: Calls = []
  constructor(
    private readonly startResult: () => Promise<void> = async () => {},
    private readonly health: () => Promise<AtallaHealthCheckResult> = async () => ({
      healthy: true
    }),
    private readonly stopResult: () => Promise<void> = async () => {}
  ) {}

  start(): Promise<void> {
    this.started = true
    this.calls.push('start')
    return this.startResult()
  }

  async stop(): Promise<void> {
    this.stopped = true
    this.calls.push('stop')
    return this.stopResult()
  }

  healthCheck(): Promise<AtallaHealthCheckResult> {
    return this.health()
  }
}

interface Recorded {
  lines: { level: string; msg?: string; obj: object }[]
}

function recordingLogger(record: Recorded): Logger {
  const log = (level: string) => (obj: object, msg?: string) => {
    record.lines.push({ level, msg, obj })
  }
  const logger: Logger = {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    child: () => logger
  }
  return logger
}

class FakeProcess implements Process {
  handlers = new Map<string, () => void>()
  exits: number[] = []
  private exited!: (code: number) => void
  readonly exitedWith = new Promise<number>((resolve) => {
    this.exited = resolve
  })

  constructor(readonly env: Record<string, string | undefined>) {}

  exit(code: number): void {
    this.exits.push(code)
    this.exited(code)
  }

  once(signal: NodeJS.Signals, handler: () => void): void {
    this.handlers.set(signal, handler)
  }
}

function run(
  server: FakeServer,
  proc = new FakeProcess(env),
  connect?: () => Promise<void>
) {
  const record: Recorded = { lines: [] }
  let config: ServerConfig | undefined
  let hsm: AtallaTransportConfig | undefined
  const transport = new FakeTransport(server.calls, connect)
  const done = main(
    'merchant',
    (c) => {
      config = c
      return server
    },
    proc,
    () => recordingLogger(record),
    (h) => {
      hsm = h
      return transport
    }
  )
  return { done, proc, record, config: () => config, hsm: () => hsm, transport }
}

test('starts, checks health, stays up', async () => {
  const server = new FakeServer()
  const { done, proc, record, config, hsm, transport } = run(server)
  await done
  assert.deepEqual(proc.exits, [])
  assert.deepEqual(config()?.grpc, { host: '0.0.0.0', port: 50052 })
  assert.equal(config()?.transport, transport)
  assert.equal(config()?.interceptors.length, 1)
  assert.equal(hsm()?.poolSize, 1)
  // The HSM connection opens before the gRPC port.
  assert.deepEqual(server.calls, ['connect', 'start'])
  assert.ok(
    record.lines.some((l) => l.msg === 'gRPC server listening, HSM healthy')
  )
  assert.ok(proc.handlers.has('SIGTERM'))
  assert.ok(proc.handlers.has('SIGINT'))
})

test('SIGTERM stops the server and exits 0', async () => {
  const server = new FakeServer()
  const { done, proc } = run(server)
  await done
  proc.handlers.get('SIGTERM')!()
  proc.handlers.get('SIGINT')!()
  assert.equal(await proc.exitedWith, 0)
  assert.ok(server.stopped)
  assert.deepEqual(proc.exits, [0])
  // The server stops before the wrapper closes the transport it owns.
  assert.deepEqual(server.calls, ['connect', 'start', 'stop', 'close'])
})

test('a stop that fails or hangs exits 1', async () => {
  for (const stop of [() => Promise.reject(new Error('boom')), () => never]) {
    const { done, proc, record } = run(
      new FakeServer(undefined, undefined, stop)
    )
    await done
    proc.handlers.get('SIGTERM')!()
    assert.equal(await proc.exitedWith, 1)
    assert.ok(
      record.lines.some((l) => l.level === 'error' && l.msg === 'stop failed')
    )
  }
})

test('exits 1 when start fails, hangs, or the HSM is unhealthy', async () => {
  const servers = [
    new FakeServer(() => Promise.reject(new Error('ECONNREFUSED'))),
    new FakeServer(() => never),
    new FakeServer(undefined, async () => ({
      healthy: false,
      error: 'unexpected health-check response code: 00'
    })),
    new FakeServer(undefined, async () => ({
      healthy: false,
      responseCode: '00'
    })),
    new FakeServer(undefined, async () => ({ healthy: false }))
  ]
  for (const server of servers) {
    const { done, proc, record } = run(server)
    await done
    assert.deepEqual(proc.exits, [1])
    assert.ok(
      record.lines.some(
        (l) => l.level === 'error' && l.msg === 'adapter failed to start'
      )
    )
    // No stop() and no close(): close() can hang on a pending connect.
    assert.equal(server.stopped, false)
    assert.ok(!server.calls.includes('close'))
  }
})

test('exits 1 without opening the gRPC port when the HSM connect fails or hangs', async () => {
  for (const connect of [
    () => Promise.reject(new Error('ECONNREFUSED')),
    () => never
  ]) {
    const server = new FakeServer()
    const { done, proc, record } = run(server, undefined, connect)
    await done
    assert.deepEqual(proc.exits, [1])
    assert.ok(
      record.lines.some(
        (l) => l.level === 'error' && l.msg === 'adapter failed to start'
      )
    )
    assert.equal(server.started, false)
    assert.deepEqual(server.calls, ['connect'])
  }
})

test('a SIGTERM during start-up stops without a second exit', async () => {
  let failConnect!: (error: Error) => void
  const server = new FakeServer()
  const proc = new FakeProcess({ ...env, START_TIMEOUT_MS: '10000' })
  const { done } = run(
    server,
    proc,
    () =>
      new Promise((_, reject) => {
        failConnect = reject
      })
  )
  proc.handlers.get('SIGTERM')!()
  failConnect(new Error('closed'))
  await done
  assert.equal(await proc.exitedWith, 0)
  assert.deepEqual(proc.exits, [0])
})

test('bad configuration exits 1 before building a server', async () => {
  const proc = new FakeProcess({})
  let built = false
  const errors: unknown[] = []
  const original = console.error
  console.error = (...args: unknown[]) => {
    errors.push(args.join(' '))
  }
  try {
    await main(
      'issuer',
      () => {
        built = true
        return new FakeServer()
      },
      proc,
      undefined,
      () => {
        built = true
        return new FakeTransport([])
      }
    )
  } finally {
    console.error = original
  }
  assert.deepEqual(proc.exits, [1])
  assert.equal(built, false)
  assert.match(String(errors[0]), /hsm-adapter-issuer: ATALLA_HOST is required/)
})

test('logCalls logs the RPC name, duration and code at debug, never the payload', async () => {
  const record: Recorded = { lines: [] }
  const interceptor = logCalls(recordingLogger(record))
  // Only method.name is read; the rest of the request is not logged.
  const request = {
    method: { name: 'TranslatePin' },
    message: { pinBlock: 'secret' }
  } as never

  const ok = interceptor(async () => ({ message: {} }) as never)
  await ok(request)
  const failing = interceptor(async () => {
    throw new ConnectError('hsm down', Code.Unavailable)
  })
  await assert.rejects(failing(request), /hsm down/)
  const unknown = interceptor(async () => {
    throw new Error('boom')
  })
  await assert.rejects(unknown(request), /boom/)

  const logged = record.lines.map(
    (l) => l.obj as { rpc: string; code: string; ms: number }
  )
  assert.deepEqual(
    logged.map((l) => [l.rpc, l.code]),
    [
      ['TranslatePin', 'OK'],
      ['TranslatePin', 'Unavailable'],
      ['TranslatePin', 'Unknown']
    ]
  )
  assert.ok(logged.every((l) => typeof l.ms === 'number'))
  assert.ok(record.lines.every((l) => l.level === 'debug'))
  assert.ok(!JSON.stringify(record.lines).includes('secret'))
})

test('withTimeout passes a result through and rejects a slow promise', async () => {
  assert.equal(await withTimeout(Promise.resolve(7), 50, 'x'), 7)
  await assert.rejects(
    withTimeout(never, 5, 'connect'),
    /connect timed out after 5 ms/
  )
})

test('createLogger builds a pino logger at the configured level', () => {
  const logger = createLogger(
    readConfig('issuer', { ...env, LOG_LEVEL: 'debug' })
  )
  assert.equal((logger as unknown as { level: string }).level, 'debug')
})
