# GitHub Copilot Instructions — Interledger TestNet

## Project Summary

**Interledger TestNet** is an open-source, full-stack Node.js/TypeScript monorepo demonstrating Interledger Protocol integration. It consists of:
- **Wallet Backend** (NestJS) — Account management, KYC, payment rails
- **Wallet Frontend** (Next.js) — User-facing web UI for accounts and transactions
- **Boutique Backend** (Express) — E-commerce demo server
- **Boutique Frontend** (Vite) — E-commerce storefront
- **Shared Packages** — Common backend & frontend utilities

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

| Command | Purpose | Time | Notes |
|---------|---------|------|-------|
| `pnpm checks` | ESLint (--max-warnings=0) + Prettier check | ~3s | **Always run before PR** — catches formatting and linting issues |
| `pnpm test` | Jest unit tests (wallet + boutique backends) | ~80s | Runs `jest --passWithNoTests --maxWorkers` per package; uses experimental VM modules |
| `pnpm format` | Auto-fix ESLint + Prettier | ~5s | Mutates files in place; safe to run |
| `pnpm build` | Compile all packages to `dist/` and `.next/` | ~30s | Requires correct Node version; builds dependencies first |

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

**To replicate locally** (before pushing):
```bash
pnpm checks && pnpm test
```

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
│   ├── ci.yml                        # PR validation (checks → builds → tests)
│   ├── deploy.yml                    # Main branch: deploy to staging/prod
│   └── setup/action.yml              # Reusable setup action (Node + pnpm + install)
│
├── local/                            # Local development environment
│   ├── docker-compose.yml            # Services: Postgres, Redis, Traefik, etc.
│   ├── .env.example, .env.local      # Environment configuration
│   └── scripts/local-tools.sh        # Cert, host, trust management
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
- **Workspace config**: `pnpm-workspace.yaml` lists 4 package globs
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

4. **Replicate CI locally**: The `.github/workflows/ci.yml` logic matches these commands exactly:
   - Step 1: `pnpm checks`
   - Step 2: `pnpm {package}:frontend build` (if labeled)
   - Step 3: `pnpm {package}:backend test --detectOpenHandles --forceExit` (if build passed)

5. **Document discovered issues**: If you find information in this file is incomplete or incorrect, update this file in your PR.

6. **Common agent mistakes to avoid**:
   - Using `npm install` instead of `pnpm install --frozen-lockfile` ← **Always use pnpm**
   - Editing Node version ← **Requires nvm; never repo-change**
   - Running tests before `pnpm install --frozen-lockfile` ← **Always install first**
   - Ignoring ESLint warnings ← **--max-warnings=0 enforced; must be 0**

---

**Updated**: April 2026  
**Maintained By**: Interledger Foundation
