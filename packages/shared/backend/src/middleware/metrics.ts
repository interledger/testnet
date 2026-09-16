import {
  Registry,
  Histogram,
  Gauge,
  collectDefaultMetrics
} from '@prometheus-io/client'
import type { Request, Response, NextFunction } from 'express'
import http, { type Server } from 'http'

export function createMetricsRegistry(): Registry {
  const register = new Registry()
  collectDefaultMetrics({ register, eventLoopMonitoringPrecision: 5 })
  return register
}

export function createHttpMetrics(register: Registry) {
  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
    registers: [register]
  })

  const httpRequestsInFlight = new Gauge({
    name: 'http_requests_in_flight',
    help: 'Number of in-flight HTTP requests',
    labelNames: ['method'] as const,
    registers: [register]
  })

  const httpMetricsMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const end = httpRequestDuration.startTimer()
    httpRequestsInFlight.inc({ method: req.method })

    // 'finish' doesn't fire if the client disconnects early (aborted request,
    // timeout) — 'close' covers that case, but also fires after a normal
    // 'finish'. Guard so the gauge/histogram are finalized exactly once.
    let finalized = false
    const finalize = () => {
      if (finalized) return
      finalized = true
      httpRequestsInFlight.dec({ method: req.method })
      // req.route is unset for router.use('*', ...) catch-alls (used for 404s
      // in both apps), so without this fallback every unmatched/scanned path
      // would become its own label series (unbounded cardinality).
      const route = req.route?.path
        ? `${req.baseUrl}${req.route.path}`
        : 'unmatched'
      end({ method: req.method, route, status_code: String(res.statusCode) })
    }
    res.once('finish', finalize)
    res.once('close', finalize)
    next()
  }

  return { httpMetricsMiddleware, httpRequestDuration, httpRequestsInFlight }
}

// Serves /metrics on its own port, separate from the app's main HTTP port,
// so Prometheus scraping never has to be threaded through cors/helmet/auth
// middleware ordering on the app router.
export function startMetricsServer(register: Registry, port: number): Server {
  const server = http.createServer((req, res) => {
    if (req.url !== '/metrics') {
      res.statusCode = 404
      res.end()
      return
    }
    register
      .metrics()
      .then((body) => {
        res.setHeader('Content-Type', register.contentType)
        res.end(body)
      })
      .catch((e) => {
        res.statusCode = 500
        res.end(e instanceof Error ? e.message : 'Internal Server Error')
      })
  })
  server.listen(port)
  return server
}

export type { Registry } from '@prometheus-io/client'
