import {
  context,
  diag,
  DiagLogLevel,
  metrics,
  propagation,
  trace
} from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator
} from '@opentelemetry/core'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import {
  type Instrumentation,
  registerInstrumentations
} from '@opentelemetry/instrumentation'
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node'
import {
  defaultResource,
  detectResources,
  envDetector,
  type Resource,
  resourceFromAttributes
} from '@opentelemetry/resources'
import {
  MeterProvider,
  PeriodicExportingMetricReader
} from '@opentelemetry/sdk-metrics'
import {
  BatchSpanProcessor,
  NodeTracerProvider,
  ParentBasedSampler,
  TraceIdRatioBasedSampler
} from '@opentelemetry/sdk-trace-node'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions'
import type { TelemetryConfig } from './config'
import { type PathRedaction, UrlRedactingSpanProcessor } from './redact'
import { type DropRootSpan, DropRootSpanSampler } from './sampler'

// Not yet in the stable semantic conventions export.
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name'

// The OTLP exporters give up on one export after this long. The metric reader
// needs a timeout no longer than its interval.
const EXPORT_TIMEOUT_MILLIS = 10_000

export interface TelemetryLogger {
  info(message: string): void
  warn(message: string): void
}

export interface TelemetryOptions {
  // Called only when telemetry is enabled. An instrumentation patches its
  // module when it is constructed, so with telemetry off nothing is patched.
  instrumentations?: () => Instrumentation[]
  // The application logger usually does not exist yet, because winston must
  // load after its instrumentation. Defaults to the console.
  logger?: TelemetryLogger
  // Path segments that carry a secret, such as a password reset token. Every
  // span's URL attributes are rewritten with these before export, and the
  // query string is always dropped. See redact.ts.
  redactUrlPaths?: PathRedaction[]
  // Spans that may not start a trace, by name: work outside any request, such
  // as a polling loop's queries. They are still traced inside a request, and
  // their metrics are still recorded. See sampler.ts.
  dropRootSpan?: DropRootSpan
}

export interface Telemetry {
  // Flushes and stops every pipeline. Safe to call more than once.
  shutdown(): Promise<void>
}

const noopTelemetry: Telemetry = { shutdown: async () => {} }

export function buildResource(config: TelemetryConfig): Resource {
  const attributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: config.service.name,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.service.env
  }
  if (config.service.version) {
    attributes[ATTR_SERVICE_VERSION] = config.service.version
  }

  // OTEL_RESOURCE_ATTRIBUTES is read, so the chart can add the pod identity.
  // The configured service attributes win over it.
  return defaultResource()
    .merge(detectResources({ detectors: [envDetector] }))
    .merge(resourceFromAttributes(attributes))
}

// The gRPC exporters pick their credentials from the URL scheme.
function exporterUrl(config: TelemetryConfig): string {
  return `${config.insecure ? 'http' : 'https'}://${config.endpoint}`
}

// Installs the global tracer and meter providers. With telemetry disabled it
// installs nothing, and the OpenTelemetry API stays a no-op. The exporters
// connect lazily, so a collector that is down does not stop the service.
export function startTelemetry(
  config: TelemetryConfig,
  options: TelemetryOptions = {}
): Telemetry {
  const logger = options.logger ?? console

  if (!config.enabled) {
    logger.info('telemetry is disabled')
    return noopTelemetry
  }

  // Export failures are logged, and do not stop the service.
  diag.setLogger(
    {
      error: (message, ...args) =>
        logger.warn(`telemetry: ${message} ${args.join(' ')}`.trim()),
      warn: (message, ...args) =>
        logger.warn(`telemetry: ${message} ${args.join(' ')}`.trim()),
      info: () => {},
      debug: () => {},
      verbose: () => {}
    },
    DiagLogLevel.WARN
  )

  const contextManager = new AsyncLocalStorageContextManager().enable()
  context.setGlobalContextManager(contextManager)
  propagation.setGlobalPropagator(
    new CompositePropagator({
      propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()]
    })
  )

  const resource = buildResource(config)
  const url = exporterUrl(config)
  const shutdowns: (() => Promise<void>)[] = [
    async () => {
      context.disable()
      propagation.disable()
      diag.disable()
    }
  ]

  let tracerProvider: NodeTracerProvider | undefined
  if (config.traces.enabled) {
    tracerProvider = new NodeTracerProvider({
      resource,
      sampler: new ParentBasedSampler({
        root: options.dropRootSpan
          ? new DropRootSpanSampler(
              options.dropRootSpan,
              new TraceIdRatioBasedSampler(config.traces.sampleRatio)
            )
          : new TraceIdRatioBasedSampler(config.traces.sampleRatio)
      }),
      spanProcessors: [
        // Must come first, so the exporter only sees redacted spans.
        new UrlRedactingSpanProcessor(options.redactUrlPaths),
        new BatchSpanProcessor(
          new OTLPTraceExporter({ url, timeoutMillis: EXPORT_TIMEOUT_MILLIS })
        )
      ]
    })
    trace.setGlobalTracerProvider(tracerProvider)
    const provider = tracerProvider
    shutdowns.push(async () => {
      await provider.shutdown()
      trace.disable()
    })
  }

  let meterProvider: MeterProvider | undefined
  if (config.metrics.enabled) {
    meterProvider = new MeterProvider({
      resource,
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url,
            timeoutMillis: EXPORT_TIMEOUT_MILLIS
          }),
          exportIntervalMillis: config.metrics.intervalMillis,
          exportTimeoutMillis: Math.min(
            config.metrics.intervalMillis,
            EXPORT_TIMEOUT_MILLIS
          )
        })
      ]
    })
    metrics.setGlobalMeterProvider(meterProvider)
    const provider = meterProvider
    shutdowns.push(async () => {
      await provider.shutdown()
      metrics.disable()
    })
  }

  const instrumentations = [
    ...(config.metrics.enabled ? [new RuntimeNodeInstrumentation()] : []),
    ...(options.instrumentations?.() ?? [])
  ]
  const unregister = registerInstrumentations({
    instrumentations,
    tracerProvider,
    meterProvider
  })
  shutdowns.push(async () => unregister())

  logger.info(
    `telemetry is enabled: endpoint=${config.endpoint} traces=${config.traces.enabled} metrics=${config.metrics.enabled}`
  )

  let done: Promise<void> | undefined
  return {
    shutdown: () => {
      // Stop the instrumentations first, the providers next, and the globals
      // last. Every step runs, even when an earlier one fails.
      done ??= (async () => {
        const errors: unknown[] = []
        for (const stop of [...shutdowns].reverse()) {
          try {
            await stop()
          } catch (error) {
            errors.push(error)
          }
        }
        if (errors.length > 0) {
          throw new AggregateError(errors, 'telemetry shutdown failed')
        }
      })()
      return done
    }
  }
}
