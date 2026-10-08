import { metrics, trace } from '@opentelemetry/api'
import {
  Server,
  ServerCredentials,
  type UntypedServiceImplementation
} from '@grpc/grpc-js'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import type { TelemetryConfig } from '@/config'
import { buildResource, startTelemetry } from '@/telemetry'

const silent = { info: jest.fn(), warn: jest.fn() }

const config = (overrides: Partial<TelemetryConfig> = {}): TelemetryConfig => ({
  enabled: true,
  // Nothing listens on port 1.
  endpoint: '127.0.0.1:1',
  insecure: true,
  traces: { enabled: true, sampleRatio: 1 },
  metrics: { enabled: true, intervalMillis: 60_000 },
  service: { name: 'wallet-test', version: 'v9.9.9', env: 'test' },
  ...overrides
})

// An OTLP gRPC receiver that keeps the raw request bytes. Protobuf stores
// strings as UTF-8, so a test can look for an attribute value in them.
async function startReceiver() {
  const received = { traces: [] as Buffer[], metrics: [] as Buffer[] }
  const exportMethod = (path: string) => ({
    path,
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Buffer) => value,
    requestDeserialize: (value: Buffer) => value,
    // An empty message is a valid Export*ServiceResponse.
    responseSerialize: () => Buffer.alloc(0),
    responseDeserialize: (value: Buffer) => value
  })
  const handler =
    (into: Buffer[]): UntypedServiceImplementation[string] =>
    (
      call: { request: Buffer },
      callback: (error: null, response: Buffer) => void
    ) => {
      into.push(call.request)
      callback(null, Buffer.alloc(0))
    }

  const server = new Server()
  server.addService(
    {
      Export: exportMethod(
        '/opentelemetry.proto.collector.trace.v1.TraceService/Export'
      )
    },
    { Export: handler(received.traces) }
  )
  server.addService(
    {
      Export: exportMethod(
        '/opentelemetry.proto.collector.metrics.v1.MetricsService/Export'
      )
    },
    { Export: handler(received.metrics) }
  )

  const port = await new Promise<number>((resolve, reject) =>
    server.bindAsync(
      '127.0.0.1:0',
      ServerCredentials.createInsecure(),
      (error, boundPort) => (error ? reject(error) : resolve(boundPort))
    )
  )

  return {
    endpoint: `127.0.0.1:${port}`,
    received,
    stop: () =>
      new Promise<void>((resolve) => server.tryShutdown(() => resolve()))
  }
}

describe('startTelemetry', (): void => {
  const originalResourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES

  afterEach((): void => {
    if (originalResourceAttributes === undefined) {
      delete process.env.OTEL_RESOURCE_ATTRIBUTES
    } else {
      process.env.OTEL_RESOURCE_ATTRIBUTES = originalResourceAttributes
    }
  })

  it('installs nothing and builds no instrumentation when disabled', async (): Promise<void> => {
    const instrumentations = jest.fn(() => [])
    const telemetry = startTelemetry(config({ enabled: false }), {
      instrumentations,
      logger: silent
    })

    expect(instrumentations).not.toHaveBeenCalled()
    expect(trace.getTracer('test').startSpan('span').isRecording()).toBe(false)
    expect(metrics.getMeterProvider().constructor.name).toBe(
      'NoopMeterProvider'
    )
    expect(silent.info).toHaveBeenCalledWith('telemetry is disabled')

    await telemetry.shutdown()
  })

  it('starts without a reachable collector', async (): Promise<void> => {
    const telemetry = startTelemetry(config(), { logger: silent })

    const span = trace.getTracer('test').startSpan('span')
    expect(span.isRecording()).toBe(true)
    span.end()

    // The final flush cannot reach the collector. Shutdown still finishes,
    // and reports the failed export instead of hiding it.
    const startedAt = Date.now()
    await expect(telemetry.shutdown()).rejects.toThrow(
      'telemetry shutdown failed'
    )
    expect(Date.now() - startedAt).toBeLessThan(15_000)
  }, 30_000)

  it('builds the instrumentations when enabled', async (): Promise<void> => {
    const instrumentations = jest.fn(() => [])
    const telemetry = startTelemetry(
      config({
        traces: { enabled: true, sampleRatio: 1 },
        metrics: { enabled: false, intervalMillis: 60_000 }
      }),
      {
        instrumentations,
        logger: silent
      }
    )

    expect(instrumentations).toHaveBeenCalledTimes(1)
    await telemetry.shutdown()
  })

  it('has a shutdown that is safe to call more than once', async (): Promise<void> => {
    const telemetry = startTelemetry(
      config({ metrics: { enabled: false, intervalMillis: 60_000 } }),
      { logger: silent }
    )

    const first = telemetry.shutdown()
    const second = telemetry.shutdown()
    expect(second).toBe(first)
    await first
    await expect(telemetry.shutdown()).resolves.toBeUndefined()
  })

  it('removes the global providers on shutdown', async (): Promise<void> => {
    const telemetry = startTelemetry(
      config({ metrics: { enabled: false, intervalMillis: 60_000 } }),
      { logger: silent }
    )
    await telemetry.shutdown()

    expect(trace.getTracer('test').startSpan('span').isRecording()).toBe(false)
  })

  it('records nothing with a sample ratio of 0', async (): Promise<void> => {
    const telemetry = startTelemetry(
      config({
        traces: { enabled: true, sampleRatio: 0 },
        metrics: { enabled: false, intervalMillis: 60_000 }
      }),
      { logger: silent }
    )

    expect(trace.getTracer('test').startSpan('span').isRecording()).toBe(false)
    await telemetry.shutdown()
  })

  it('exports traces and metrics to the endpoint, with the service identity', async (): Promise<void> => {
    const receiver = await startReceiver()
    try {
      const telemetry = startTelemetry(
        config({ endpoint: receiver.endpoint }),
        { logger: silent }
      )

      trace.getTracer('test').startSpan('exported-span').end()
      metrics.getMeter('test').createCounter('exported_counter').add(1)

      // Shutdown flushes both pipelines.
      await telemetry.shutdown()

      const traces = Buffer.concat(receiver.received.traces).toString('utf8')
      const exportedMetrics = Buffer.concat(receiver.received.metrics).toString(
        'utf8'
      )
      expect(traces).toContain('exported-span')
      expect(traces).toContain('wallet-test')
      expect(exportedMetrics).toContain('exported_counter')
      expect(exportedMetrics).toContain('wallet-test')
      expect(silent.warn).not.toHaveBeenCalled()
    } finally {
      await receiver.stop()
    }
  }, 30_000)
})

describe('buildResource', (): void => {
  afterEach((): void => {
    delete process.env.OTEL_RESOURCE_ATTRIBUTES
  })

  it('carries the service identity', (): void => {
    const { attributes } = buildResource(config())

    expect(attributes).toMatchObject({
      [ATTR_SERVICE_NAME]: 'wallet-test',
      'service.version': 'v9.9.9',
      'deployment.environment.name': 'test'
    })
  })

  it('leaves out an empty version', (): void => {
    const { attributes } = buildResource(
      config({ service: { name: 'wallet-test', version: '', env: 'test' } })
    )

    expect(attributes).not.toHaveProperty('service.version')
  })

  it('adds OTEL_RESOURCE_ATTRIBUTES, but the configured identity wins', (): void => {
    process.env.OTEL_RESOURCE_ATTRIBUTES =
      'k8s.pod.name=wallet-backend-abc,service.name=from-env'

    const { attributes } = buildResource(config())

    expect(attributes).toMatchObject({
      'k8s.pod.name': 'wallet-backend-abc',
      [ATTR_SERVICE_NAME]: 'wallet-test'
    })
  })
})
