import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor
} from '@opentelemetry/sdk-trace-node'
import {
  type PathRedaction,
  REDACTED,
  redactUrl,
  UrlRedactingSpanProcessor
} from '@/redact'
import { WALLET_SECRET_PATHS } from '@/secretPaths'

// `[^/:]` skips a route template's `:token`, which is no secret.
const paths: PathRedaction[] = [
  [/\/reset-password\/[^/:][^/]*/, '/reset-password/{token}'],
  [
    /\/grant-interactions\/[^/:][^/]*\/[^/:][^/]*/,
    '/grant-interactions/{interactionId}/{nonce}'
  ]
]

describe('redactUrl', (): void => {
  it.each([
    ['/reset-password/abc123', '/reset-password/{token}'],
    ['/reset-password/abc123/validate', '/reset-password/{token}/validate'],
    [
      'http://wallet-backend:4003/reset-password/abc123/validate',
      'http://wallet-backend:4003/reset-password/{token}/validate'
    ],
    [
      '/grant-interactions/int-1/nonce-2/',
      '/grant-interactions/{interactionId}/{nonce}/'
    ],
    // The query string's content always goes.
    [
      '/grant-interactions?interactId=int-1&nonce=nonce-2',
      `/grant-interactions?${REDACTED}`
    ],
    ['/reset-password/abc123?x=1#y', `/reset-password/{token}?${REDACTED}`],
    // A fragment is dropped; it never reaches a server anyway.
    ['/accounts#top', '/accounts'],
    ['/accounts/abc', '/accounts/abc'],
    ['GET /reset-password/:token', 'GET /reset-password/:token']
  ])('rewrites %s as %s', (value, expected): void => {
    expect(redactUrl(value, paths)).toBe(expected)
  })
})

describe('UrlRedactingSpanProcessor', (): void => {
  const exporter = new InMemorySpanExporter()
  const provider = new NodeTracerProvider({
    spanProcessors: [
      new UrlRedactingSpanProcessor(paths),
      new SimpleSpanProcessor(exporter)
    ]
  })
  const tracer = provider.getTracer('test')

  afterEach((): void => exporter.reset())
  afterAll(async (): Promise<void> => provider.shutdown())

  it('rewrites the URL attributes before the exporter sees them', (): void => {
    tracer
      .startSpan('GET', {
        attributes: {
          'url.path': '/reset-password/abc123/validate',
          'url.query': 'interactId=int-1',
          'url.full':
            'http://wallet-backend:4003/reset-password/abc123/validate?a=b',
          'http.target': '/reset-password/abc123',
          'http.route': '/reset-password/:token/validate',
          'http.request.method': 'GET'
        }
      })
      .end()

    const [span] = exporter.getFinishedSpans()
    expect(span.attributes).toEqual({
      'url.path': '/reset-password/{token}/validate',
      'url.query': REDACTED,
      'url.full': `http://wallet-backend:4003/reset-password/{token}/validate?${REDACTED}`,
      'http.target': '/reset-password/{token}',
      'http.route': '/reset-password/:token/validate',
      'http.request.method': 'GET'
    })
  })

  it('rewrites the raw request line Next.js copies into next.span_name', (): void => {
    tracer
      .startSpan('GET /grant-interactions', {
        attributes: {
          'next.span_name': 'GET /grant-interactions?interactId=int-1&nonce=n'
        }
      })
      .end()

    expect(exporter.getFinishedSpans()[0].attributes['next.span_name']).toBe(
      `GET /grant-interactions?${REDACTED}`
    )
  })

  it('rewrites a span name that holds a raw path', (): void => {
    tracer.startSpan('GET /reset-password/abc123').end()

    expect(exporter.getFinishedSpans()[0].name).toBe(
      'GET /reset-password/{token}'
    )
  })

  it('leaves a span without URL attributes alone', (): void => {
    tracer
      .startSpan('pg.query:SELECT wallet_backend', {
        attributes: { 'db.query.text': 'select * from users where id = $1' }
      })
      .end()

    const [span] = exporter.getFinishedSpans()
    expect(span.name).toBe('pg.query:SELECT wallet_backend')
    expect(span.attributes).toEqual({
      'db.query.text': 'select * from users where id = $1'
    })
  })
})

describe('WALLET_SECRET_PATHS', (): void => {
  it.each([
    ['/reset-password/abc123/validate', '/reset-password/{token}/validate'],
    ['/verify-email/abc123', '/verify-email/{token}'],
    [
      '/grant-interactions/int-1/nonce-2/',
      '/grant-interactions/{interactionId}/{nonce}/'
    ],
    ['/auth/reset/abc123', '/auth/reset/{token}'],
    ['/auth/verify/abc123', '/auth/verify/{token}'],
    [
      'http://wallet-backend:4003/verify-email/abc123',
      'http://wallet-backend:4003/verify-email/{token}'
    ],
    // Route templates name spans and carry no secret.
    ['POST /reset-password/:token', 'POST /reset-password/:token'],
    ['GET /auth/reset/[token]', 'GET /auth/reset/[token]'],
    ['/accounts/abc/wallet-addresses', '/accounts/abc/wallet-addresses']
  ])('rewrites %s as %s', (value, expected): void => {
    expect(redactUrl(value, WALLET_SECRET_PATHS)).toBe(expected)
  })
})
