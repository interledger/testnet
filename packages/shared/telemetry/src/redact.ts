import type { Span, SpanProcessor } from '@opentelemetry/sdk-trace-node'

// A path segment that carries a secret, and what to write in its place. For
// example [/\/reset-password\/[^/:][^/]*/, '/reset-password/{token}']. The
// `[^/:]` leaves a route template's `:token` alone.
export type PathRedaction = [pattern: RegExp, replacement: string]

export const REDACTED = 'REDACTED'

// The URL attributes the HTTP, undici and Next.js instrumentations write,
// under the stable and the older semantic conventions. Next.js also copies
// the raw request line, query included, into next.span_name.
const URL_ATTRIBUTES = [
  'url.full',
  'url.path',
  'url.original',
  'http.target',
  'http.url',
  'next.span_name'
] as const

// Drops the query string's content and rewrites each secret path segment. The
// query goes as a whole: the wallet passes interaction ids and nonces there,
// and a list of known keys would miss the next one.
export function redactUrl(value: string, paths: PathRedaction[]): string {
  const queryOrFragment = value.search(/[?#]/)
  let path = queryOrFragment === -1 ? value : value.slice(0, queryOrFragment)
  for (const [pattern, replacement] of paths) {
    path = path.replace(pattern, replacement)
  }
  return value[queryOrFragment] === '?' ? `${path}?${REDACTED}` : path
}

// Rewrites the URL attributes and the name of every span as it ends, before
// any exporter sees it. Must come before the exporting span processor.
export class UrlRedactingSpanProcessor implements SpanProcessor {
  constructor(private readonly paths: PathRedaction[] = []) {}

  onStart(): void {}

  onEnding(span: Span): void {
    for (const key of URL_ATTRIBUTES) {
      const value = span.attributes[key]
      if (typeof value === 'string') {
        span.setAttribute(key, redactUrl(value, this.paths))
      }
    }
    if (typeof span.attributes['url.query'] === 'string') {
      span.setAttribute('url.query', REDACTED)
    }

    const name = redactUrl(span.name, this.paths)
    if (name !== span.name) span.updateName(name)
  }

  onEnd(): void {}

  async forceFlush(): Promise<void> {}

  async shutdown(): Promise<void> {}
}
