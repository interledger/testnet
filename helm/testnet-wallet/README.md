# TestNet Wallet Helm Chart

Deploys the Interledger TestNet Wallet application to Kubernetes. The chart manages these workloads:

- **backend** — NestJS API (`test-wallet-backend` image, HTTP port `4003`)
- **frontend** — Next.js UI (`test-wallet-frontend` image, port `4003`)
- **hsm-adapter-issuer** and **hsm-adapter-merchant** — optional, off by
  default. The issuer and merchant HSM adapter contracts over gRPC
  (`test-wallet-hsm-adapter-issuer` and `test-wallet-hsm-adapter-merchant`
  images, ports `50051` and `50052`)

## Dependencies

Depends on the `common` chart from `https://interledger.github.io/charts/interledger`, which provides shared helpers (`common.configMapper`, `common.secretMapper`, `common.deployment`, `common.fullname`).

## Versioning

`version` and `appVersion` in `Chart.yaml` are set to `0.0.1` as placeholders. **Do not edit them manually.** The publishing pipeline stamps both fields with the release version before packaging.

## Configuration

All application configuration is driven through `values.yaml`. Environment variables are split into two categories:

### ConfigMaps (non-sensitive)

Defined under `configMaps.backend.contentMap` and `configMaps.frontend.contentMap`. Keys map directly to environment variable names injected into each container via `envFrom`.

**Frontend ConfigMap keys**

Read per request, never baked into the image: to move the wallet to a different
hostname, change the value and restart the pod. The names carry no
`NEXT_PUBLIC_` prefix because Next.js replaces those with literals at build
time.

| Key                    | `values.yaml` path                      |
| ---------------------- | --------------------------------------- |
| `NODE_ENV`             | `config.frontend.nodeEnv`               |
| `PORT`                 | `config.frontend.port`                  |
| `COOKIE_NAME`          | `config.frontend.cookie.name`           |
| `BACKEND_URL`          | `config.frontend.urls.backend`          |
| `BACKEND_INTERNAL_URL` | `config.frontend.urls.backendInternal`  |
| `OPEN_PAYMENTS_HOST`   | `config.frontend.urls.openPaymentsHost` |
| `AUTH_HOST`            | `config.frontend.urls.authHost`         |
| `THEME`                | `config.frontend.theme`                 |
| `GATEHUB_ENV`          | `config.frontend.gatehub.env`           |
| `FEATURES_ENABLED`     | `config.frontend.features.enabled`      |

`BACKEND_URL` may be absolute, or a path such as `/wallet-api` where one
hostname serves the frontend at `/` and the backend at a prefix — a path needs
no edit when DNS changes. When it is a path, set `BACKEND_INTERNAL_URL` to the
in-cluster Service address: SSR has no origin to resolve against, and the
container refuses to start without it.

`BACKEND_URL`, `OPEN_PAYMENTS_HOST` and `AUTH_HOST` are required. The container
checks them before accepting traffic and exits if one is missing. It also
rejects a `BACKEND_URL` or `BACKEND_INTERNAL_URL` that is neither an absolute
http(s) URL nor, for `BACKEND_URL`, a path beginning with `/`.

**Backend ConfigMap keys** (see `configMaps.backend.contentMap` in `values.yaml` for the full list — covers `NODE_ENV`, `PORT`, cookie settings, GateHub config, Rafiki endpoints, Stripe flags, rate limiting, card URLs, and more).

### Secrets

Defined under `secretsMaps.backend.contentMap`. Secrets are only created by the chart when `config.backend.shouldCreateSecrets: true` (defaults to `false` — secrets must pre-exist in the cluster).

| Secret key                | Description                   |
| ------------------------- | ----------------------------- |
| `databaseUrl`             | PostgreSQL connection string  |
| `cookiePassword`          | Session cookie signing secret |
| `identity.serverSecret`   | Kratos identity server secret |
| `redis.url`               | Redis connection URL          |
| `webhook.signatureSecret` | Rafiki webhook HMAC secret    |
| `gatehub.secretKey`       | GateHub API secret key        |
| `gatehub.webhookSecret`   | GateHub webhook secret        |
| `email.sendgridKey`       | Sendgrid API key              |
| `rate.apiKey`             | Exchange rate API key         |
| `stripe.webhookSecret`    | Stripe webhook secret         |
| `stripe.secretKey`        | Stripe secret key             |
| `rafiki.adminApiSecret`   | Rafiki admin API secret       |

Secrets are mounted into the backend container via individual `env[].valueFrom.secretKeyRef` entries (not `envFrom`).

### Atalla HSM adapters

`hsmAdapter` deploys `<fullname>-hsm-adapter-issuer` (port `50051`, called by
the issuer API) and `<fullname>-hsm-adapter-merchant` (port `50052`, called by
the merchant API). Each runs one replica, with one HSM connection. See
[`packages/wallet/hsm-adapter`](../../packages/wallet/hsm-adapter/README.md).

Both are off by default. An enabled role needs an Atalla host and port, and a
TLS Secret when TLS is on:

```yaml
hsmAdapter:
  atalla:
    host: 10.0.0.1
    port: 13506
    tls:
      enabled: true
      secretName: wallet-atalla # ca.crt, client.crt and client.key
  issuer:
    enabled: true
  merchant:
    enabled: true
```

The listeners are cleartext h2c. Keep the gRPC ports off the Ingress.

### OpenTelemetry

The backend and the frontend's Node.js server can push traces and metrics over
OTLP/gRPC. The chart runs one OpenTelemetry collector per release, built the
same way as the collector in the merchant and issuer charts. The browser sends
nothing.

Telemetry is off by default. One block turns it on for both components:

```yaml
config:
  telemetry:
    enabled: true
    serviceEnv: cards-playground
```

With `enabled: true` the chart:

- adds the `TELEMETRY_*` and `SERVICE_*` keys to both ConfigMaps. They are not
  contentMap entries; `templates/_helpers.tpl` renders them. See
  `packages/shared/telemetry` for each key.
- points both components at `<release>-otel-collector:4317`, unless
  `config.telemetry.endpoint` names another collector. The render fails if
  `otelCollector.enabled` is false and no endpoint is set.
- sets `SERVICE_VERSION` to the component's image tag.

Each pod gets `POD_NAME`, `POD_NAMESPACE` and `OTEL_RESOURCE_ATTRIBUTES` through
`extraEnv`, not `env`, so an environment that rewrites `env` keeps them.
`service.instance.id` keeps the series of two replicas apart.

The collector:

- exposes the metrics on a Prometheus endpoint (`metrics`, port 8889) and its
  own metrics on `telemetry` (port 8888). A ServiceMonitor scrapes both. The
  chart renders the ServiceMonitor only where the Prometheus Operator CRDs
  exist; `helm template` needs `--api-versions
monitoring.coreos.com/v1/ServiceMonitor` to show it.
- forwards traces to `otelCollector.traces.endpoint`. Empty drops them. On
  ilf-1 the Tempo address is `core-tempo.monitoring.svc.cluster.local:4317`,
  and the namespace needs `network.allowTracingEgress` in its
  deploy-environment.

`otelCollector.config` replaces the generated collector config wholesale.

The metrics follow the OpenTelemetry semantic conventions. Examples:
`http_server_request_duration_seconds` (with `http_route` on the backend),
`http_client_request_duration_seconds`, `db_client_operation_duration_seconds`
and `nodejs_eventloop_*`.

## Image Tags

By default both deployments use the chart's `appVersion` as the image tag. To pin a specific tag for one image:

```yaml
deployments:
  backend:
    image:
      tag: 'v0.1.66'
```

## Installing the Chart

```bash
helm repo add testnet https://interledger.github.io/testnet
helm repo update

helm install testnet-wallet testnet/testnet-wallet \
  --set config.backend.shouldCreateSecrets=false \
  --set config.backend.hosts.openPayments="https://ilp.example.com" \
  --set config.backend.hosts.frontend="https://wallet.example.com"
```

When `shouldCreateSecrets: false`, create the backend secret manually before installing:

```bash
kubectl create secret generic <release-name>-backend \
  --from-literal=databaseUrl="postgres://..." \
  --from-literal=cookiePassword="..." \
  # ... remaining keys
```

## CI/CD

- **On PR** (`helm/testnet-wallet/**` changed): `helm-charts.yml` runs lint, unit tests (`helm unittest`), and a default-values render.
- **On release**: `helm-publish.yml` stamps the version, packages the chart, and pushes it to the `charts` branch (served via GitHub Pages).

## Compatibility

The environment variable keys in `configMaps` and `secretsMaps` must stay in sync with the application code in `packages/wallet/backend/src/` and `packages/wallet/frontend/src/`. If you rename or add an env var in the application, update the chart's `values.yaml` and `configMaps`/`secretsMaps` in the same PR.
