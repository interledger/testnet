# GitHub Copilot Instructions for Interledger Test Network

## Purpose And Scope

Test Network is a full-stack pnpm workspace monorepo for Interledger sandbox integrations. It contains two apps:

- Wallet (`packages/wallet/*`): Next.js frontend + Node/Express backend.
- Boutique (`packages/boutique/*`): Vite/React frontend + Node/Express backend.

Shared packages are in `packages/shared/backend`, `packages/wallet/shared`, and `packages/boutique/shared`.

Use this file as the default source of truth. Trust these instructions and only search the repo when this file is incomplete or proven wrong.

## Runtime And Tooling (Strict)

- Node: `^20.12.1` required by `package.json` engines.
- Package manager: `pnpm@9.1.4` (`packageManager` field).
- Never use `npm install` or `yarn` in this repo.

Local shell note validated on this machine: default `node` was `v18.19.1`, which causes engine failures even if `pnpm` exists. Ensure Node 20 is first on `PATH` before running scripts.

Example reliable setup:

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH
corepack pnpm -v
node -v
```

## Bootstrap, Build, Test, Lint (Validated)

Run from repo root `testnet/`.

1. Bootstrap (always first):

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm install --frozen-lockfile
```

Validated: passes in ~1.5s when lockfile is up to date.

2. Quality checks:

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm checks
```

Validated behavior: may fail on existing repo formatting drift (Prettier). In this workspace it failed on:

- `.github/copilot-instructions.md`
- `docker/local/docker-compose.yml`
- `docker/local/rafiki-setup.js`
- `packages/wallet/frontend/next.config.js`
- `packages/wallet/frontend/src/middleware.ts`

3. Lint only (for signal isolation):

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm lint:check
```

Validated behavior: currently fails on `packages/wallet/frontend/src/middleware.ts` (`@typescript-eslint/no-explicit-any`).

4. Build all:

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm build
```

Validated behavior: currently fails quickly if Docker-created artifacts are root-owned (TS5033 / EACCES in `packages/wallet/shared/dist`).

5. Package-scoped backend verification:

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm boutique:backend build
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm boutique:backend test
```

Validated: passes (`5` suites, `29` tests) in ~17s for tests.

Wallet backend flow currently blocked by the same `wallet/shared/dist` permission issue:

```bash
PATH=/home/$USER/.nvm/versions/node/v20.20.0/bin:$PATH corepack pnpm wallet:backend build
```

## Known Failure Modes And Workarounds

1. Engine mismatch (`Unsupported environment`, Node 18 shown):

- Cause: shell not using Node 20.
- Fix: put Node 20 bin first in `PATH` for every command (or `nvm use lts/iron` in an interactive shell that works reliably).

2. `TS5033` / `EACCES` writing under `packages/wallet/shared/dist`:

- Cause: prior Docker runs produced root-owned build artifacts.
- Symptom: root build and wallet backend build fail.
- Fix: ensure those files are writable by your user before rebuilding (example: adjust ownership/permissions of `packages/wallet/shared/dist` and `packages/wallet/shared/tsconfig.build.tsbuildinfo`).

3. `pnpm checks` failing even without your changes:

- Cause: pre-existing formatting/lint drift.
- Mitigation: run targeted checks for touched packages and report baseline failures explicitly in PR notes.

No command timeouts were observed in this validation pass. Failing commands exited quickly (under ~6s except build/test commands).

## Local Run Flow

Required precondition before first `pnpm dev`:

```bash
cp docker/dev/.env.example docker/dev/.env
```

GateHub-related variables in `docker/dev/.env` are required for full KYC/funding flows.

Main run modes:

- `pnpm dev` -> hot-reload backend containers + frontend dev servers.
- `pnpm dev:debug` -> backend debug mode (`9229`, `9230`).
- `pnpm dev:lite` -> run built backend (no hot reload).
- `pnpm localenv:stop` -> stop local docker environment.

Service endpoints:

- Wallet FE: `http://localhost:4003`
- Wallet BE: `http://localhost:3003`
- Boutique FE: `http://localhost:4004`
- Boutique BE: `http://localhost:3004`
- Rafiki Admin UI: `http://localhost:3012`

## Architecture And File Map

High-signal root files:

- `package.json`: canonical scripts and engine constraints.
- `pnpm-workspace.yaml`: workspace package patterns.
- `tsconfig.json`: top-level project references.
- `eslint.config.mjs`, `.prettierrc.js`: repo-wide code quality rules.
- `docker/dev/docker-compose.yml`: full local dependency graph (Postgres, Redis, Rafiki, Kratos, app backends).

Key source areas:

- Wallet backend: `packages/wallet/backend/src`
- Wallet frontend: `packages/wallet/frontend`
- Boutique backend: `packages/boutique/backend/src`
- Boutique frontend: `packages/boutique/frontend/src`
- Shared backend utilities: `packages/shared/backend/src`

## CI And PR Expectations

Primary workflows:

- `.github/workflows/ci.yml`
  - Always runs `pnpm checks`.
  - Build/test jobs are gated by PR labels (`package: wallet/backend`, `package: boutique/frontend`, etc.).
  - Wallet backend CI test command: `pnpm wallet:backend build && pnpm wallet:backend test --detectOpenHandles --forceExit`.
- `.github/workflows/pr_title_check.yml`
  - PR title must satisfy Conventional Commits.
- `.github/workflows/build-publish.yaml`
  - Builds package matrix on PR/push; publishes images on `v*` tags.

Before opening a PR, replicate the relevant CI subset for your changed package(s) and note any pre-existing baseline failures.

## Agent Operating Rule

When implementing changes, follow this file first, execute commands in the documented order, and avoid broad repo searches unless required details are missing or incorrect.
