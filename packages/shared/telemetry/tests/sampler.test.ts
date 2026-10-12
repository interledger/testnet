import { context, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import {
  AlwaysOnSampler,
  InMemorySpanExporter,
  NodeTracerProvider,
  ParentBasedSampler,
  SimpleSpanProcessor
} from '@opentelemetry/sdk-trace-node'
import { DropRootSpanSampler } from '@/sampler'

describe('DropRootSpanSampler', (): void => {
  const exporter = new InMemorySpanExporter()
  const provider = new NodeTracerProvider({
    sampler: new ParentBasedSampler({
      root: new DropRootSpanSampler(
        (name) => name.startsWith('pg.'),
        new AlwaysOnSampler()
      )
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)]
  })
  const tracer = provider.getTracer('test')
  const contextManager = new AsyncLocalStorageContextManager().enable()

  beforeAll((): void => {
    context.setGlobalContextManager(contextManager)
  })
  afterEach((): void => exporter.reset())
  afterAll(async (): Promise<void> => {
    context.disable()
    await provider.shutdown()
  })

  it('drops a matching span that would start a trace', (): void => {
    const span = tracer.startSpan('pg.query:SELECT wallet_backend')
    expect(span.isRecording()).toBe(false)
    span.end()

    expect(exporter.getFinishedSpans()).toHaveLength(0)
  })

  it('keeps the same span inside a request', (): void => {
    tracer.startActiveSpan('GET /accounts/:id', (request) => {
      tracer.startSpan('pg.query:SELECT wallet_backend').end()
      request.end()
    })

    expect(exporter.getFinishedSpans().map((span) => span.name)).toEqual([
      'pg.query:SELECT wallet_backend',
      'GET /accounts/:id'
    ])
  })

  it('leaves other root spans to the delegate', (): void => {
    tracer.startSpan('GET /me').end()

    expect(exporter.getFinishedSpans()).toHaveLength(1)
  })

  it('drops the children of a dropped root as well', (): void => {
    const dropped = tracer.startSpan('pg.connect')

    context.with(trace.setSpan(context.active(), dropped), () => {
      expect(tracer.startSpan('pg.query:SELECT').isRecording()).toBe(false)
    })
  })
})
