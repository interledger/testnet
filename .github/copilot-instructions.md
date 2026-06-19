# GitHub Copilot Instructions — Interledger TestNet

## Project Summary

**Interledger TestNet** is an open-source, full-stack Node.js/TypeScript monorepo demonstrating Interledger Protocol integration. It consists of:

- **Wallet Backend** (NestJS) — Account management, KYC, payment rails
- **Wallet Frontend** (Next.js) — User-facing web UI for accounts and transactions
- **Boutique Backend** (Express) — E-commerce demo server
- **Boutique Frontend** (Vite) — E-commerce storefront
- **Shared Packages** — Common backend & frontend utilities
- **E2E Tests** (`e2e/`) — Playwright + playwright-bdd (Gherkin) end-to-end tests against the local environment
- **Helm Charts** (`helm/`) — Kubernetes charts for `boutique` and `testnet-wallet`, published to the `charts` branch via GitHub Pages

**Size**: ~100K lines of TypeScript + Node.js; ~80 test files; ~10 npm packages
**Purpose**: Reference implementation for Account Servicing Entities integrating with Interledger Protocol and Rafiki
**Key Integrations**: Rafiki (ILP), MockGatehub (sandbox KYC/fiat), Stripe, GateHub, Kratos (identity)

---

## Prerequisites

### Required Environment

- **Node.js 20 LTS** (`lts/iron`, enforced by `package.json` engines field)
- **pnpm 9.x** (managed via Corepack; CI uses `pnpm/action-setup@v2`)
- **Docker** and **Docker Compose** (for local services: Postgres, Redis, Traefik, Kratos, Rafiki, MockGatehub)
- **Git**

### Setup Steps (First Time Only)

```bash
# 1. Switch to Node 20 (assumes nvm installed)
nvm install lts/iron
nvm use lts/iron

# 2. Enable Corepack (pnpm package manager)
corepack enable

# 3. Clone and navigate
cd /path/to/testnet

# 4. Install all dependencies
pnpm install --frozen-lockfile

# 5. (Optional) Local development setup (interactive, requires Docker, sudo)
pnpm local:setup
```

**Critical**: Always run `pnpm install --frozen-lockfile` after pulling; never use `npm install` or `yarn install`.

---

## Build & Validation Commands

### Core Commands (Work Immediately After Setup)

| Command         | Purpose                                      | Time  | Notes                                                                                |
| --------------- | -------------------------------------------- | ----- | ------------------------------------------------------------------------------------ |
| `pnpm checks`   | ESLint (--max-warnings=0) + Prettier check   | ~3s   | **Always run before PR** — catches formatting and linting issues                     |
| `pnpm test`     | Jest unit tests (wallet + boutique backends) | ~80s  | Runs `jest --passWithNoTests --maxWorkers` per package; uses experimental VM modules |
| `pnpm format`   | Auto-fix ESLint + Prettier                   | ~5s   | Mutates files in place; safe to run                                                  |
| `pnpm build`    | Compile all packages to `dist/` and `.next/` | ~30s  | Requires correct Node version; builds dependencies first                             |
| `pnpm e2e:test` | Playwright e2e tests (headless)              | ~2min | Requires full local stack running; see E2E Tests section below                       |

### Per-Package Commands

```bash
# Wallet backend
pnpm wallet:backend build     # Compile wallet backend (NestJS)
pnpm wallet:backend test      # Unit tests (Jest)
pnpm wallet:backend dev       # Watch mode (Requires local services up)

# Wallet frontend
pnpm wallet:frontend build    # Next.js production build
pnpm wallet:frontend dev      # Dev server (Requires backend services)

# Boutique backend
pnpm boutique:backend build    # Express app builds via TypeScript
pnpm boutique:backend test     # Jest unit tests
pnpm boutique:backend dev      # Watch mode

# Boutique frontend
pnpm boutique:frontend build   # Vite production build
pnpm boutique:frontend dev     # Dev server
```

### Repository Maintenance

```bash
pnpm clean             # Remove all node_modules/ and dist/.next/
pnpm clean:builds      # Remove dist/.next/ only
pnpm prettier:write    # Auto-format all files
pnpm lint:fix          # Auto-fix eslint issues
```

### E2E Tests

End-to-end tests use **Playwright** + **playwright-bdd** (Gherkin `.feature` files). They run against the local environment at `https://testnet.test`.

**Prerequisites**: Full local stack must be running (`pnpm local:setup && pnpm dev`).

```bash
# Install Playwright browsers (once per machine)
pnpm e2e:install

# Run all scenarios headless
pnpm e2e:test

# Run all scenarios with visible browser
pnpm e2e:test:headed

# Run a specific scenario by grep (run from e2e/ directory)
cd e2e && pnpm exec playwright test --grep "auth"
```

**Email verification** in tests uses a **DB-token + real-endpoint bypass**: `verifyUserDirectly()` in `e2e/helpers/local-wallet.ts` writes a fresh token hash to Postgres and then calls `POST /verify-email/:token` on the wallet backend directly (`http://localhost:3003`, not the Traefik proxy). This runs the real verification code path — setting `isEmailVerified`, clearing the token, and calling MockGatehub `createManagedUser` so `gateHubUserId` is populated. Without `gateHubUserId` the KYC page returns 404. No email infrastructure or Sendgrid account is needed. The DB URL and API URL can be overridden via `TEST_DB_URL` and `TEST_API_URL` in `e2e/.env`.

**Account isolation**: every test run creates a unique user via `createUniqueCredentials()` (timestamped email). Tests are fully independent and safe to run in parallel.

> **AI agent guidance — race condition check**: When adding or modifying e2e tests, warn the developer if the change introduces a potential race condition. Common causes: sharing a single account across parallel tests, assertions on aggregate counts (total transactions, balance sums) that could be affected by other concurrent tests, or test setup that depends on the order of prior tests. Each scenario must create its own isolated user and assert only on state scoped to that user.

**Feature files**: `e2e/features/*.feature`  
**Step definitions**: `e2e/features/steps/`  
**Helpers**: `e2e/helpers/local-wallet.ts`  
**Config**: `e2e/playwright.config.ts`; env overrides in `e2e/.env` (see `e2e/.env.example`)  
**Detailed guide**: `e2e/README.md`

---

## CI/CD Validation Pipeline

Every PR automatically runs:

1. **Checks** (runs on all PRs)

   ```bash
   pnpm checks  # ESLint --max-warnings=0 + prettier --check
   ```

2. **Conditional Builds** (based on PR labels: `package: wallet/frontend`, `package: wallet/backend`, etc.)

   ```bash
   pnpm wallet:frontend build
   pnpm wallet:backend build
   pnpm boutique:frontend build
   pnpm boutique:backend build
   ```

3. **Conditional Tests** (after builds pass)

   ```bash
   pnpm wallet:backend test --detectOpenHandles --forceExit
   pnpm boutique:backend test --detectOpenHandles --forceExit
   ```

4. **Helm chart validation** (runs on all PRs touching `helm/**`)

   `helm-charts.yml` runs for both charts in parallel (matrix):

   ```bash
   helm dependency update helm/<chart>
   helm lint helm/<chart>
   helm unittest helm/<chart>
   helm template <chart> helm/<chart>
   ```

**To replicate locally** (before pushing):

```bash
pnpm checks && pnpm test
```

---

## Release Process

Releases are created manually via the **"Create Release"** GitHub Actions workflow (`release.yml`). There is no automatic release on merge to `main`.

### How it works

1. Developers write PRs with [Conventional Commit](https://www.conventionalcommits.org/) titles (enforced by `pr_title_check.yml`).
2. When ready to release, run the **Create Release** workflow from the GitHub Actions UI and select the target branch.
3. The workflow runs [semantic-release](https://github.com/semantic-release/semantic-release) which:
   - Analyses commit history since the last tag
   - Determines the version bump (`fix:` → patch, `feat:` → minor, `BREAKING CHANGE` → major)
   - Creates a git tag (`vX.Y.Z`) and a GitHub Release with auto-generated notes
   - Publishes Docker images to GHCR tagged `vX.Y.Z` and `latest`
   - Triggers `helm-publish.yml` (via `release: published` event), which stamps both Helm charts with the release version, packages them, and pushes the tarballs + updated `index.yaml` to the `charts` branch (served by GitHub Pages at `https://interledger.github.io/testnet`)

All commit types (`chore:`, `docs:`, `ci:`, etc.) trigger at least a patch bump — running "Create Release" always produces a new version.

### Releasable branches

| Branch         | Release type          | Notes                                                  |
| -------------- | --------------------- | ------------------------------------------------------ |
| `main`         | patch / minor / major | Determined by commit types                             |
| `release/vX.Y` | patch only            | `feat:` or breaking commits cause the workflow to fail |

### Maintenance branches (`release/vX.Y`)

A maintenance branch is used to backport fixes to an older minor version:

```bash
# Create a maintenance branch from the last patch tag of that minor
git checkout -b release/v1.0 v1.0.44
# Cherry-pick fix commits onto it
git cherry-pick <sha>
# Then run "Create Release" against release/v1.0 in the GitHub UI
```

The workflow validates that no `feat:` or `BREAKING CHANGE` commits are present before releasing.

### Conventional Commit quick reference

| Prefix                                                             | Effect     |
| ------------------------------------------------------------------ | ---------- |
| `fix:`                                                             | Patch bump |
| `feat:`                                                            | Minor bump |
| `feat!:` / `BREAKING CHANGE:`                                      | Major bump |
| `chore:`, `docs:`, `ci:`, `refactor:`, `test:`, `style:`, `build:` | Patch bump |

---

## Project Structure

```
testnet/
├── package.json                      # Root workspace scripts
├── pnpm-workspace.yaml               # Defines monorepo packages
├── tsconfig.base.json                # Shared TypeScript config
├── .eslintrc.js, .prettierrc.js     # Lint & format config
├── .nvmrc                            # Node version (lts/iron)
│
├── .github/workflows/
│   ├── ci.yml                        # PR validation (ESLint + Prettier)
│   ├── build-publish.yaml            # Build validation on PRs and main
│   ├── helm-charts.yml               # PR validation for Helm charts (lint + unittest + template render)
│   ├── helm-publish.yml              # Publishes Helm charts to `charts` branch on GitHub release
│   ├── release.yml                   # Manual "Create Release" workflow (semantic-release)
│   ├── deploy.yml                    # Manual deploy to staging/prod (workflow_dispatch)
│   ├── pr_title_check.yml            # Enforces conventional commit format on PR titles
│   ├── pr_labeler.yml                # Auto-labels PRs by changed paths
│   └── setup/action.yml              # Reusable setup action (Node + pnpm + install)
├── release.config.js                 # semantic-release config (supports main + release/vX.Y branches)
│
├── helm/
│   ├── testnet-boutique/             # Helm chart for Boutique (backend + frontend)
│   │   ├── Chart.yaml                # Chart metadata — version stamped automatically on release
│   │   ├── values.yaml               # Default values (configMaps, secretsMaps, deployments, services)
│   │   ├── templates/                # Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets)
│   │   └── tests/                    # helm-unittest test suite
│   └── testnet-wallet/               # Helm chart for TestNet Wallet (backend + frontend)
│       ├── Chart.yaml                # Chart metadata — version stamped automatically on release
│       ├── values.yaml               # Default values (configMaps, secretsMaps, deployments, services)
│       ├── templates/                # Kubernetes manifests
│       └── tests/                    # helm-unittest test suite
│
├── local/                            # Local development environment
│   ├── docker-compose.yml            # Services: Postgres, Redis, Traefik, etc.
│   ├── .env.example, .env.local      # Environment configuration
│   └── scripts/local-tools.sh        # Cert, host, trust management
│
├── e2e/                              # Playwright e2e test suite
│   ├── features/                     # Gherkin .feature files + step definitions
│   ├── helpers/                      # Shared test utilities (auth, email verification bypass)
│   ├── playwright.config.ts          # Playwright configuration
│   └── .env.example                  # E2E environment overrides
│
├── packages/
│   ├── wallet/
│   │   ├── backend/src/              # NestJS application
│   │   ├── backend/tests/            # Jest unit tests
│   │   ├── frontend/src/             # Next.js application
│   │   └── shared/                   # Shared wallet types
│   ├── boutique/
│   │   ├── backend/src/              # Express application
│   │   ├── backend/tests/            # Jest unit tests
│   │   ├── frontend/src/             # Vite application
│   │   └── shared/                   # Shared boutique types
│   └── shared/backend/src/           # Monorepo utilities (logging, DB, etc.)
│
└── README.md, .github/TESTNET_architecture.md
```

### Key Files

- **Root scripts**: `package.json` lines 15–50 define all entry points
- **Workspace config**: `pnpm-workspace.yaml` lists 5 package globs (includes `e2e`)
- **TypeScript config**: `tsconfig.base.json` (target ES2020, strict: true)
- **ESLint**: `.eslintrc.js` (--max-warnings=0 enforced in CI)
- **Prettier**: `.prettierrc.js` (checked before any lint/build)

---

## Common Scenarios & Troubleshooting

### Scenario: Node Version Mismatch

**Symptom**: `ERR_PNPM_UNSUPPORTED_ENGINE Expected version: ^20.12.1`

**Fix**:

```bash
nvm install lts/iron && nvm use lts/iron && pnpm install --frozen-lockfile
```

### Scenario: Stale Dependencies

**Symptom**: Tests or build fail with module resolution errors

**Fix**:

```bash
pnpm clean && pnpm install --frozen-lockfile && pnpm test
```

### Scenario: Email Verification During Local Development

**Context**: The wallet sends a verification email on signup. With `SEND_EMAIL=false` (the default in `.env.local`), emails are not sent — the verification link is logged to the backend console instead.

**View the link**: Check the wallet backend logs for `Send email is disabled. Verify email link is: ...` and open it in the browser manually. E2E tests bypass this entirely — see `e2e/README.md`.

### Scenario: One Pre-Existing Test Failure

**File**: `packages/wallet/backend/tests/walletAddressKeys/controller.test.ts` line 175  
**Status**: Known issue; not blocking CI (Jest uses `--passWithNoTests`)  
**Result**: `215 tests passed, 1 failed` (expected)

### Scenario: Linting Fails Before Tests Run

**Symptom**: `pnpm checks` fails; `pnpm test` doesn't run

**Fix**:

```bash
pnpm format  # Auto-fixes 90% of issues
pnpm checks  # Re-run validation
```

### Scenario: Tests Hang or Timeout

**Symptom**: Jest stalls during test run

**Workaround**: (Pre-applied in CI) Use `--detectOpenHandles --forceExit` flags:

```bash
pnpm wallet:backend test --detectOpenHandles --forceExit
```

### Scenario: Build Fails on Initial `pnpm build`

**Cause**: Likely missing Node 20 or missing deps

**Fix**:

```bash
node --version  # Verify v20.x.x
pnpm install --frozen-lockfile
pnpm build
```

---

## Helm Charts

The `helm/` directory contains two Kubernetes charts that ship alongside the application code. Both charts depend on the `common` chart from `https://interledger.github.io/charts/interledger`.

| Chart              | Directory                | Images deployed                                   |
| ------------------ | ------------------------ | ------------------------------------------------- |
| `testnet-boutique` | `helm/testnet-boutique/` | `test-boutique-backend`, `test-boutique-frontend` |
| `testnet-wallet`   | `helm/testnet-wallet/`   | `test-wallet-backend`, `test-wallet-frontend`     |

### Chart structure

Each chart follows the same pattern:

- **`values.yaml`** — all configuration lives here: `config.*` (app settings), `configMaps.*` (env var keys → value references), `secretsMaps.*` (secret keys → value references), `deployments.*`, `services.*`
- **`templates/`** — delegates to `common` helpers (`common.configMapper`, `common.secretMapper`, `common.deployment`)
- **`tests/`** — `helm-unittest` test suite

### Versioning

`Chart.yaml` contains placeholder versions (`0.0.1`). The `helm-publish.yml` workflow stamps the real version from the GitHub release tag before packaging. **Never edit versions in `Chart.yaml` manually.**

### Local chart testing

```bash
# Add the common dependency repository
helm repo add interledger https://interledger.github.io/charts/interledger

# Update dependencies (required before lint/template/unittest)
helm dependency update helm/testnet-boutique
helm dependency update helm/testnet-wallet

# Lint
helm lint helm/testnet-boutique

# Unit tests (requires helm-unittest plugin)
helm plugin install https://github.com/helm-unittest/helm-unittest.git
helm unittest helm/testnet-boutique

# Render with default values
helm template testnet-boutique helm/testnet-boutique
```

### Chart repository

Charts are published to the `charts` branch of this repository and served via GitHub Pages at `https://interledger.github.io/testnet`. To add the repo:

```bash
helm repo add testnet https://interledger.github.io/testnet
helm repo update
```

---

## AI Agent Directives

1. **Trust this file first**: Before running grep/search/explore commands, check if information exists here. Minimize search time by following the command sequences documented above.

2. **Always validate prerequisites**:
   - Node version: `node --version` → must be `v20.x.x`
   - pnpm installed: `pnpm --version` → must be `9.x`
   - Dependences installed: Run `pnpm install --frozen-lockfile` before any other command

3. **Validate changes locally before committing**:
   - **Format**: `pnpm format`
   - **Lint**: `pnpm checks`
   - **Test**: `pnpm test` (expect 215 pass, 1 pre-existing fail)
   - **Build** (if package changed): `pnpm {package}:backend build` or `pnpm {package}:frontend build`
   - **E2E** (if e2e/ or wallet changed): `pnpm e2e:test` (requires full local stack)

4. **Replicate CI locally**: The `ci.yml` + `build-publish.yaml` logic matches these commands exactly:
   - Step 1: `pnpm checks`
   - Step 2: `pnpm {package}:frontend build` (if labeled)
   - Step 3: `pnpm {package}:backend test --detectOpenHandles --forceExit` (if build passed)
   - Releases are **not** created automatically — use the "Create Release" workflow in GitHub Actions

5. **Document discovered issues**: If you find information in this file is incomplete or incorrect, update this file in your PR.

6. **Common agent mistakes to avoid**:
   - Using `npm install` instead of `pnpm install --frozen-lockfile` ← **Always use pnpm**
   - Editing Node version ← **Requires nvm; never repo-change**
   - Running tests before `pnpm install --frozen-lockfile` ← **Always install first**
   - Ignoring ESLint warnings ← **--max-warnings=0 enforced; must be 0**

7. **Alert on Helm chart compatibility breaks**: When a PR modifies any of the following, cross-check against the Helm charts and **warn the developer explicitly** if a mismatch is found:

   | Change type                                      | Files to check                                                             | Chart locations to verify                                                                                                 |
   | ------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
   | Dockerfile `ENV`, `ARG`, or exposed port changes | `packages/boutique/*/Dockerfile.prod`, `packages/wallet/*/Dockerfile.prod` | `helm/testnet-boutique/values.yaml`, `helm/testnet-wallet/values.yaml` — `deployments.*.ports`, `configMaps.*.contentMap` |
   | New or renamed env var in application code       | `packages/boutique/backend/src/`, `packages/boutique/frontend/src/`        | `helm/testnet-boutique/values.yaml` — `configMaps.*.contentMap` and `secretsMaps.*.contentMap`                            |
   | New or renamed env var in application code       | `packages/wallet/backend/src/`, `packages/wallet/frontend/src/`            | `helm/testnet-wallet/values.yaml` — `configMaps.*.contentMap` and `secretsMaps.*.contentMap`                              |

   **What to check**: The `configMaps.*.contentMap[].key` entries are the exact environment variable names injected into the container. The `secretsMaps.*.contentMap[].key` entries are Kubernetes secret keys referenced by name in the deployment `env` block. If the app reads an env var that has no corresponding `key` in the chart (or vice versa), the deployed pod will start with missing or unused configuration.

   **Alert format**: Add a comment to your response such as: _"Warning: `NEW_ENV_VAR` is read by the boutique backend but is not present in `helm/testnet-boutique/values.yaml` configMaps. Add it to `configMaps.backend.contentMap` and a corresponding entry under `config.backend` in `values.yaml`."_

---

**Updated**: June 2026  
**Maintained By**: Interledger Foundation
