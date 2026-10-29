# @shared/telemetry

This package sets up OpenTelemetry for the wallet backend and the wallet frontend server. Both
components use it, so their traces and metrics have the same settings, resource attributes and
redaction rules.

## Why it is a separate package

- The wallet frontend image does not contain `@shared/backend`.
- The entry point of `@shared/backend` loads Express, knex and winston. An instrumentation can
  patch a module only before that module loads. This package loads none of those modules, so an
  application can start telemetry first.

## What it does

`startTelemetry(config, options)` installs the global tracer and meter providers.

- It sends traces and metrics over OTLP/gRPC to the collector at `TELEMETRY_ENDPOINT`.
- It adds `service.name`, `service.version` and `deployment.environment.name` to every span and
  metric. It also reads `OTEL_RESOURCE_ATTRIBUTES`. The Helm chart uses that variable for the pod
  identity.
- It always records the Node.js runtime metrics. The application supplies the other
  instrumentations, for example HTTP, Express or Postgres.
- It removes secrets from URLs before export. It drops the query string. It also replaces the
  path segments in `WALLET_SECRET_PATHS`, for example a password reset token.
- It can stop some spans from starting a trace. The backend uses this for the Postgres queries of
  its polling loop. Those queries still count in the Postgres metrics.
- With `TELEMETRY_ENABLED=false` it installs nothing, and the OpenTelemetry API stays a no-op.

The exporters connect when they first send data. A collector that is not available does not stop
the application. `shutdown()` sends the data that is still in the buffers.

## Settings

The application reads these environment variables. The names match the `telemetry:` block of
merchant-api and issuer-api.

| Variable                        | Default | Purpose                                                     |
| ------------------------------- | ------- | ----------------------------------------------------------- |
| `TELEMETRY_ENABLED`             | `false` | Turns traces and metrics on.                                |
| `TELEMETRY_ENDPOINT`            | (empty) | The collector, as `host:port`. Do not use a URL.            |
| `TELEMETRY_INSECURE`            | `false` | Sends without TLS. The collector in the chart needs `true`. |
| `TELEMETRY_TRACES_ENABLED`      | `true`  | Turns traces on.                                            |
| `TELEMETRY_TRACES_SAMPLE_RATIO` | `1`     | Share of new traces to keep, from 0 to 1.                   |
| `TELEMETRY_METRICS_ENABLED`     | `true`  | Turns metrics on.                                           |
| `TELEMETRY_METRICS_INTERVAL`    | `15s`   | Time between two metric exports.                            |
| `SERVICE_NAME`                  | per app | `wallet-backend` or `wallet-frontend`.                      |
| `SERVICE_VERSION`               | (empty) | The image tag. The chart sets it.                           |
| `SERVICE_ENV`                   | `dev`   | The environment name, for example `cards-playground`.       |

The application checks these values at start-up. A wrong value stops the process with a message
that names the variable.

## Where it is used

- `packages/wallet/backend/src/telemetry.ts`. `index.ts` imports this file first.
- `packages/wallet/frontend/src/instrumentation.node.ts`. Next.js runs this file when the server
  starts.

To see the data locally, run `pnpm dev:observability`. See `pnpm local:help`.

## Tests

```sh
pnpm --filter @shared/telemetry test
```

One test starts an OTLP receiver in the test process. It checks that a span and a metric reach the
collector endpoint.
