import { parseDuration, parseTelemetryEnv } from '@/config'

const defaults = { serviceName: 'wallet-test' }

const enabled = {
  TELEMETRY_ENABLED: 'true',
  TELEMETRY_ENDPOINT: 'wallet-otel-collector:4317',
  TELEMETRY_INSECURE: 'true'
}

describe('parseTelemetryEnv', (): void => {
  it('is disabled by default, with the merchant-api defaults', (): void => {
    expect(parseTelemetryEnv({}, defaults)).toEqual({
      enabled: false,
      endpoint: '',
      insecure: false,
      traces: { enabled: true, sampleRatio: 1 },
      metrics: { enabled: true, intervalMillis: 15_000 },
      service: { name: 'wallet-test', version: '', env: 'dev' }
    })
  })

  it('accepts an enabled block with an endpoint', (): void => {
    const config = parseTelemetryEnv(
      {
        ...enabled,
        TELEMETRY_TRACES_SAMPLE_RATIO: '0.25',
        TELEMETRY_METRICS_INTERVAL: '30s',
        SERVICE_NAME: 'wallet-backend',
        SERVICE_VERSION: 'v1.3.0',
        SERVICE_ENV: 'cards-playground'
      },
      defaults
    )

    expect(config).toEqual({
      enabled: true,
      endpoint: 'wallet-otel-collector:4317',
      insecure: true,
      traces: { enabled: true, sampleRatio: 0.25 },
      metrics: { enabled: true, intervalMillis: 30_000 },
      service: {
        name: 'wallet-backend',
        version: 'v1.3.0',
        env: 'cards-playground'
      }
    })
  })

  it('ignores a disabled block, even with invalid values', (): void => {
    expect(() =>
      parseTelemetryEnv(
        {
          TELEMETRY_ENABLED: 'false',
          TELEMETRY_ENDPOINT: 'http://not-checked:4317',
          TELEMETRY_TRACES_SAMPLE_RATIO: '7',
          TELEMETRY_METRICS_INTERVAL: '0s',
          TELEMETRY_TRACES_ENABLED: 'false',
          TELEMETRY_METRICS_ENABLED: 'false'
        },
        defaults
      )
    ).not.toThrow()
  })

  it('rejects an enabled block without an endpoint', (): void => {
    expect(() =>
      parseTelemetryEnv({ TELEMETRY_ENABLED: 'true' }, defaults)
    ).toThrow('TELEMETRY_ENDPOINT is not set')
  })

  it.each([
    'http://wallet-otel-collector:4317',
    'https://wallet-otel-collector:4317',
    'dns:///wallet-otel-collector:4317'
  ])('rejects an endpoint that is a URL: %s', (endpoint): void => {
    expect(() =>
      parseTelemetryEnv({ ...enabled, TELEMETRY_ENDPOINT: endpoint }, defaults)
    ).toThrow('not a URL')
  })

  it.each(['wallet-otel-collector', 'wallet-otel-collector:port', ':4317'])(
    'rejects an endpoint without a port: %s',
    (endpoint): void => {
      expect(() =>
        parseTelemetryEnv(
          { ...enabled, TELEMETRY_ENDPOINT: endpoint },
          defaults
        )
      ).toThrow('must be a gRPC target')
    }
  )

  it.each([
    'localhost:4317',
    '10.0.0.7:4317',
    '[::1]:4317',
    'wallet-otel-collector.depenv-cards-playground.svc.cluster.local:4317'
  ])('accepts the gRPC target %s', (endpoint): void => {
    expect(
      parseTelemetryEnv({ ...enabled, TELEMETRY_ENDPOINT: endpoint }, defaults)
        .endpoint
    ).toBe(endpoint)
  })

  it.each(['-0.1', '1.5', 'half'])(
    'rejects the sample ratio %s',
    (ratio): void => {
      expect(() =>
        parseTelemetryEnv(
          { ...enabled, TELEMETRY_TRACES_SAMPLE_RATIO: ratio },
          defaults
        )
      ).toThrow('TELEMETRY_TRACES_SAMPLE_RATIO')
    }
  )

  it.each(['0s', '15', 'soon', '-1s'])(
    'rejects the metrics interval %s',
    (interval): void => {
      expect(() =>
        parseTelemetryEnv(
          { ...enabled, TELEMETRY_METRICS_INTERVAL: interval },
          defaults
        )
      ).toThrow('TELEMETRY_METRICS_INTERVAL')
    }
  )

  it('rejects an enabled block with neither signal', (): void => {
    expect(() =>
      parseTelemetryEnv(
        {
          ...enabled,
          TELEMETRY_TRACES_ENABLED: 'false',
          TELEMETRY_METRICS_ENABLED: 'false'
        },
        defaults
      )
    ).toThrow('both false')
  })

  it('names every problem in one error', (): void => {
    expect(() =>
      parseTelemetryEnv(
        {
          TELEMETRY_ENABLED: 'true',
          TELEMETRY_TRACES_SAMPLE_RATIO: '2'
        },
        defaults
      )
    ).toThrow(/TELEMETRY_ENDPOINT.*TELEMETRY_TRACES_SAMPLE_RATIO/)
  })

  it('reads an empty sample ratio as unset, not as 0', (): void => {
    expect(
      parseTelemetryEnv(
        { ...enabled, TELEMETRY_TRACES_SAMPLE_RATIO: '' },
        defaults
      ).traces.sampleRatio
    ).toBe(1)
  })

  it('rejects a boolean that is not "true" or "false"', (): void => {
    expect(() =>
      parseTelemetryEnv({ TELEMETRY_ENABLED: 'yes' }, defaults)
    ).toThrow('TELEMETRY_ENABLED')
  })
})

describe('parseDuration', (): void => {
  it.each([
    ['500ms', 500],
    ['15s', 15_000],
    ['1.5s', 1_500],
    ['2m', 120_000]
  ])('reads %s as %d ms', (value, millis): void => {
    expect(parseDuration(value)).toBe(millis)
  })

  it.each(['', '15', '1h', 's'])('does not read %p', (value): void => {
    expect(parseDuration(value)).toBeUndefined()
  })
})
