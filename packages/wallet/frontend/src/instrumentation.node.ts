/**
 * Sends the server's traces and metrics to the same collector as the wallet
 * backend. The settings are the backend's TELEMETRY_* and SERVICE_* variables;
 * see packages/shared/telemetry.
 */
import {
  parseTelemetryEnv,
  startTelemetry,
  WALLET_SECRET_PATHS
} from '@shared/telemetry'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'

let config
try {
  config = parseTelemetryEnv(process.env, { serviceName: 'wallet-frontend' })
} catch (error) {
  // The same rule as the backend: a bad setting stops the pod.
  console.error(`[telemetry] Refusing to start. ${(error as Error).message}`)
  process.exit(1)
}

const telemetry = startTelemetry(config, {
  // The reset and verification pages, and the backend calls they make, carry
  // their token in the path.
  redactUrlPaths: WALLET_SECRET_PATHS,
  instrumentations: () => [
    // Server spans, and the http.server.request.duration metric.
    new HttpInstrumentation(),
    // fetch() from server-side rendering to the backend, so a page request
    // and the backend calls it makes share one trace.
    new UndiciInstrumentation()
  ]
})

// Flushes the last batch on SIGTERM and SIGINT. Next.js's own handler closes the
// server and then calls process.exit, which would drop whatever is still
// buffered. This holds that exit back until the flush finishes, so the server
// still drains as before. With telemetry off nothing is registered.
if (config.enabled) {
  const flushBeforeExit = () => {
    const exit = process.exit.bind(process)
    const flushed = telemetry.shutdown().catch((error: Error) => {
      console.error(`[telemetry] Flush on shutdown failed. ${error.message}`)
    })
    process.exit = ((code?: number) => {
      void flushed.finally(() => exit(code))
    }) as typeof process.exit
  }
  process.once('SIGTERM', flushBeforeExit)
  process.once('SIGINT', flushBeforeExit)
}
