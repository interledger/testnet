import { Request, Response } from 'express'
import { createRequest, createResponse } from 'node-mocks-http'
import { EventEmitter } from 'events'
import http from 'http'
import {
  createMetricsRegistry,
  createHttpMetrics,
  startMetricsServer
} from '@/middleware/metrics'

// httpMetricsMiddleware relies on the real 'finish' event; node-mocks-http's
// default response stubs out EventEmitter, so it must be opted back in.
const createMockResponse = () => createResponse<Response>({ eventEmitter: EventEmitter })

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${port}${path}`, (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, body })
        )
      })
      .on('error', reject)
  })
}

describe('metrics middleware', (): void => {
  it('startMetricsServer exposes Prometheus exposition format on /metrics', async (): Promise<void> => {
    const register = createMetricsRegistry()
    // port 0 lets the OS assign a free ephemeral port
    const server = startMetricsServer(register, 0)
    const port = (server.address() as { port: number }).port

    try {
      const { status, body } = await get(port, '/metrics')
      expect(status).toBe(200)
      expect(body).toContain('process_cpu_user_seconds_total')
    } finally {
      server.close()
    }
  })

  it('startMetricsServer 404s on any other path', async (): Promise<void> => {
    const register = createMetricsRegistry()
    const server = startMetricsServer(register, 0)
    const port = (server.address() as { port: number }).port

    try {
      const { status } = await get(port, '/does-not-exist')
      expect(status).toBe(404)
    } finally {
      server.close()
    }
  })

  it('records a request with a route label when req.route is set', async (): Promise<void> => {
    const register = createMetricsRegistry()
    const { httpMetricsMiddleware, httpRequestDuration } =
      createHttpMetrics(register)
    const req = createRequest<Request>({
      method: 'GET',
      route: { path: '/accounts/:id' },
      baseUrl: ''
    })
    const res = createMockResponse()
    const next = jest.fn()

    httpMetricsMiddleware(req, res, next)
    res.statusCode = 200
    res.emit('finish')

    expect(next).toHaveBeenCalled()
    const metric = await httpRequestDuration.get()
    const sample = metric.values.find((v) => v.metricName?.endsWith('_count'))
    expect(sample?.labels).toMatchObject({
      method: 'GET',
      route: '/accounts/:id',
      status_code: '200'
    })
  })

  it('falls back to an "unmatched" route label when req.route is unset', async (): Promise<void> => {
    const register = createMetricsRegistry()
    const { httpMetricsMiddleware, httpRequestDuration } =
      createHttpMetrics(register)
    const req = createRequest<Request>({ method: 'GET' })
    const res = createMockResponse()

    httpMetricsMiddleware(req, res, jest.fn())
    res.statusCode = 404
    res.emit('finish')

    const secondReq = createRequest<Request>({ method: 'GET' })
    const secondRes = createMockResponse()
    httpMetricsMiddleware(secondReq, secondRes, jest.fn())
    secondRes.statusCode = 404
    secondRes.emit('finish')

    const metric = await httpRequestDuration.get()
    const unmatchedSamples = metric.values.filter(
      (v) =>
        v.metricName?.endsWith('_count') &&
        (v.labels as Record<string, string>).route === 'unmatched'
    )
    // Both bogus requests must collapse into a single label series, not two.
    expect(unmatchedSamples).toHaveLength(1)
    expect(unmatchedSamples[0].value).toBe(2)
  })
})
