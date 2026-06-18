# Testnet Boutique Helm Chart

Deploys the Interledger TestNet Boutique demo application to Kubernetes. The chart manages two workloads:

- **backend** — Express API (`test-boutique-backend` image, port `3004`)
- **frontend** — Vite storefront (`test-boutique-frontend` image, port `4004`)

## Dependencies

Depends on the `common` chart from `https://interledger.github.io/charts/interledger`, which provides shared helpers (`common.configMapper`, `common.secretMapper`, `common.deployment`, `common.fullname`).

## Versioning

`version` and `appVersion` in `Chart.yaml` are set to `0.0.1` as placeholders. **Do not edit them manually.** The publishing pipeline stamps both fields with the release version before packaging.

## Configuration

All application configuration is driven through `values.yaml`. Environment variables are split into two categories:

### ConfigMaps (non-sensitive)

Defined under `configMaps.backend.contentMap` and `configMaps.frontend.contentMap`. Keys map directly to environment variable names injected into each container via `envFrom`.

| Service  | Key               | `values.yaml` path              |
| -------- | ----------------- | ------------------------------- |
| backend  | `NODE_ENV`        | `config.backend.nodeEnv`        |
| backend  | `PORT`            | `config.backend.port`           |
| backend  | `FRONTEND_URL`    | `config.backend.frontendUrl`    |
| backend  | `KEY_ID`          | `config.backend.keyId`          |
| backend  | `PAYMENT_POINTER` | `config.backend.paymentPointer` |
| frontend | `API_BASE_URL`    | `config.frontend.apiBaseUrl`    |
| frontend | `THEME`           | `config.frontend.theme`         |
| frontend | `CURRENCY`        | `config.frontend.currency`      |

### Secrets

Defined under `secretsMaps.backend.contentMap`. Secrets are only created by the chart when `config.backend.shouldCreateSecrets: true`. When `false`, the secret must exist in the cluster before deployment.

| Secret key     | `values.yaml` path            |
| -------------- | ----------------------------- |
| `database.url` | `config.backend.database.url` |
| `privateKey`   | `config.backend.privateKey`   |

Secrets are mounted into the backend container via individual `env[].valueFrom.secretKeyRef` entries.

## Image Tags

By default both deployments use the chart's `appVersion` as the image tag. To pin a specific tag for one image without changing the overall release:

```yaml
deployments:
  backend:
    image:
      tag: 'v0.1.65'
```

## Installing the Chart

```bash
helm repo add testnet https://interledger.github.io/testnet
helm repo update

helm install testnet-boutique testnet/testnet-boutique \
  --set config.backend.database.url="postgres://user:pass@host/db" \
  --set config.backend.privateKey="<base64-encoded-key>" \
  --set config.frontend.apiBaseUrl="https://api.boutique.example.com"
```

## CI/CD

- **On PR** (`helm/testnet-boutique/**` changed): `helm-charts.yml` runs lint, unit tests (`helm unittest`), and a default-values render.
- **On release**: `helm-publish.yml` stamps the version, packages the chart, and pushes it to the `charts` branch (served via GitHub Pages).

## Compatibility

The environment variable keys in `configMaps` and `secretsMaps` must stay in sync with the application code in `packages/boutique/backend/src/` and `packages/boutique/frontend/src/`. If you rename or add an env var in the application, update the chart's `values.yaml` and `configMaps`/`secretsMaps` in the same PR.
