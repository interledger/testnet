import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api'
import {
  type Sampler,
  SamplingDecision,
  type SamplingResult
} from '@opentelemetry/sdk-trace-node'

// Decides, by span name, which spans may not start a trace of their own.
export type DropRootSpan = (spanName: string) => boolean

// The root sampler: drops a span that would start a trace when `drop` says
// so, and leaves every other decision to `delegate`. Wrapped in
// ParentBasedSampler it only sees spans without a parent, so the same span
// inside a request is kept.
//
// Sampling decides only what is traced. Instrumentations record their
// metrics either way, so a dropped query still counts in
// db.client.operation.duration.
export class DropRootSpanSampler implements Sampler {
  constructor(
    private readonly drop: DropRootSpan,
    private readonly delegate: Sampler
  ) {}

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[]
  ): SamplingResult {
    if (this.drop(spanName)) {
      return { decision: SamplingDecision.NOT_RECORD }
    }
    return this.delegate.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links
    )
  }

  toString(): string {
    return `DropRootSpanSampler{${this.delegate.toString()}}`
  }
}
