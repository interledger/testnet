# TestNet Wallet Helm Chart

Deploys the Interledger TestNet Wallet application to Kubernetes. The chart manages two workloads:

- **backend** — NestJS API (`test-wallet-backend` image, port `4003`)
- **frontend** — Next.js UI (`test-wallet-frontend` image, port `4003`)

## Dependencies

Depends on the `common` chart from `https://interledger.github.io/charts/interledger`, which provides shared helpers (`common.configMapper`, `common.secretMapper`, `common.deployment`, `common.fullname`).

## Versioning

`version` and `appVersion` in `Chart.yaml` are set to `0.0.1` as placeholders. **Do not edit them manually.** The publishing pipeline stamps both fields with the release version before packaging.

## Configuration

All application configuration is driven through `values.yaml`. Environment variables are split into two categories:

### ConfigMaps (non-sensitive)

Defined under `configMaps.backend.contentMap` and `configMaps.frontend.contentMap`. Keys map directly to environment variable names injected into each container via `envFrom`.

**Frontend ConfigMap keys** (`NEXT_PUBLIC_*` vars + runtime config):

| Key                            | `values.yaml` path                          |
|-------------------------------|---------------------------------------------|
| `NODE_ENV`                    | `config.frontend.nodeEnv`                  |
| `PORT`                        | `config.frontend.port`                     |
| `COOKIE_NAME`                 | `config.frontend.cookie.name`              |
| `NEXT_PUBLIC_USE_TEST_KYC_DATA` | `config.frontend.features.useTestKycData` |
| `NEXT_PUBLIC_BACKEND_URL`     | `config.frontend.urls.backend`             |
| `NEXT_PUBLIC_OPEN_PAYMENTS_HOST` | `config.frontend.urls.openPaymentsHost`  |
| `NEXT_PUBLIC_AUTH_HOST`       | `config.frontend.urls.authHost`            |
| `NEXT_PUBLIC_THEME`           | `config.frontend.theme`                    |
| `NEXT_PUBLIC_GATEHUB_ENV`     | `config.frontend.gatehub.env`              |
| `NEXT_PUBLIC_FEATURES_ENABLED` | `config.frontend.features.enabled`        |

**Backend ConfigMap keys** (see `configMaps.backend.contentMap` in `values.yaml` for the full list — covers `NODE_ENV`, `PORT`, cookie settings, GateHub config, Rafiki endpoints, Stripe flags, rate limiting, card URLs, and more).

### Secrets

Defined under `secretsMaps.backend.contentMap`. Secrets are only created by the chart when `config.backend.shouldCreateSecrets: true` (defaults to `false` — secrets must pre-exist in the cluster).

| Secret key                | Description                        |
|---------------------------|------------------------------------|
| `databaseUrl`             | PostgreSQL connection string       |
| `cookiePassword`          | Session cookie signing secret      |
| `identity.serverSecret`   | Kratos identity server secret      |
| `redis.url`               | Redis connection URL               |
| `webhook.signatureSecret` | Rafiki webhook HMAC secret         |
| `gatehub.secretKey`       | GateHub API secret key             |
| `gatehub.webhookSecret`   | GateHub webhook secret             |
| `email.sendgridKey`       | Sendgrid API key                   |
| `rate.apiKey`             | Exchange rate API key              |
| `stripe.webhookSecret`    | Stripe webhook secret              |
| `stripe.secretKey`        | Stripe secret key                  |
| `rafiki.adminApiSecret`   | Rafiki admin API secret            |

Secrets are mounted into the backend container via individual `env[].valueFrom.secretKeyRef` entries (not `envFrom`).

## Image Tags

By default both deployments use the chart's `appVersion` as the image tag. To pin a specific tag for one image:

```yaml
deployments:
  backend:
    image:
      tag: "v0.1.66"
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
