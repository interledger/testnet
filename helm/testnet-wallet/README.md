# TestNet Wallet Helm Chart

Deploys the Interledger TestNet Wallet application to Kubernetes. The chart manages two workloads:

- **backend** — NestJS API (`test-wallet-backend` image, HTTP port `4003`),
  optionally hosting the issuer and merchant HSM adapters on ports `50051` and
  `50052`
- **frontend** — Next.js UI (`test-wallet-frontend` image, port `4003`)

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

The backend can serve the issuer and the merchant HSM adapter contracts over
gRPC. One process runs both servers. `serverRole` chooses which servers start:
`both`, `issuer`, or `merchant`.

The adapters are off by default. Only the cards environments run them, so a
deployment without an HSM starts without any Atalla configuration.

`templates/configMap.backend.yaml` adds the `HSM_*` and `ATALLA_*` keys to the
backend ConfigMap, and only when `enabled` is true. They are not
`configMaps.backend.contentMap` entries: the backend rejects an empty
`ATALLA_HOST` or `ATALLA_PORT` when `HSM_ENABLED` is true, and a contentMap
entry would write an empty string in every environment that leaves the value
unset. The render fails if `enabled` is true and either value is missing.

```yaml
config:
  backend:
    hsm:
      enabled: true
      serverRole: both
      grpcHost: '0.0.0.0'
      issuerPort: 50051
      merchantPort: 50052

      atalla:
        host: 10.0.0.1
        port: 13506
        timeoutMs: 2000
        poolSize: 1
        tls:
          enabled: true
          # Skips the hostname check only. The transport still sets
          # rejectUnauthorized, so the HSM certificate must chain to the CA at
          # caCertPath.
          skipServerIdentityCheck: true
          # Paths, not PEM text. The backend reads each file at start-up.
          caCertPath: /etc/atalla/tls/ca.crt
          clientCertPath: /etc/atalla/tls/client.crt
          clientKeyPath: /etc/atalla/tls/client.key
```

The issuer and merchant listeners are cleartext h2c services. Reach them inside
the namespace only, and keep the gRPC ports off the Ingress.

`enabled: true` is not enough on its own. Helm replaces a list rather than
merging it, so the environment's values file must also write out, in full:

- `deployments.backend.ports`, with the gRPC container ports added
- `services.backend.ports`, with the matching Service ports added
- `deployments.backend.volumes` and `deployments.backend.volumeMounts`, for the
  Atalla TLS files at the paths above

`env/cards-playground/wallet/testnet-wallet.yaml` in `testnet-deploy` is the
worked example.

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
