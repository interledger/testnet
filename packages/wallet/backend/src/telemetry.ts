// index.ts imports this file first. An instrumentation patches a module when
// that module is loaded, so this must run before express, pg, ioredis and
// winston are imported. Import only the environment here.
import {
  startTelemetry,
  telemetryConfigFromEnv,
  WALLET_SECRET_PATHS
} from '@shared/telemetry'
import {
  ExpressInstrumentation,
  ExpressLayerType
} from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { env } from '@/config/env'

export const telemetry = startTelemetry(
  telemetryConfigFromEnv(env, { serviceName: 'wallet-backend' }),
  {
    // The application logger is silent in tests; so is this.
    logger: env.NODE_ENV === 'test' ? { info() {}, warn() {} } : console,
    // Password reset and e-mail verification tokens travel in the path.
    redactUrlPaths: WALLET_SECRET_PATHS,
    // The pending-transaction loop queries Postgres every few seconds, outside
    // any request. Its queries would each start a trace of their own and bury
    // the requests in Tempo. They still count in the Postgres metrics.
    dropRootSpan: (name) =>
      name.startsWith('pg.') || name.startsWith('pg-pool.'),
    instrumentations: () => [
      // HTTP server and client spans, and the http.server.request.duration and
      // http.client.request.duration metrics.
      new HttpInstrumentation(),
      // Sets http.route on the HTTP spans and metrics, and adds a span for the
      // route handler. A span for every middleware and router layer would add
      // ten spans to each request and say little; http.route is still set.
      new ExpressInstrumentation({
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE, ExpressLayerType.ROUTER]
      }),
      // Query arguments are not recorded, because they carry PII.
      new PgInstrumentation(),
      new IORedisInstrumentation(),
      // fetch()
      new UndiciInstrumentation(),
      // Adds trace_id and span_id to every log line written inside a span.
      new WinstonInstrumentation({ disableLogSending: true })
    ]
  }
)
