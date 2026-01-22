# GitHub Copilot Instructions for Interledger Test Network

## Repository Overview

**Purpose**: Test Network is an open Interledger network for testing integrations with test money. It provides a complete testing environment including a wallet application and e-commerce demo (Boutique) built on Rafiki.

**Type**: Full-stack monorepo (pnpm workspaces)  
**Size**: ~640 TypeScript files, ~54k lines of code  
**Live Demos**: [Wallet](https://wallet.interledger-test.dev) | [Boutique](https://boutique.interledger-test.dev)

**Tech Stack**:
- **Runtime**: Node.js v20.12.1+ (LTS Iron - enforced via engines field)
- **Package Manager**: pnpm v9.1.4 (enforced - DO NOT use npm/yarn)
- **Languages**: TypeScript 5.9.3
- **Backend**: Express, Knex/Objection (PostgreSQL), Redis, Socket.IO
- **Frontend**: Next.js 14 (wallet), Vite + React 18 (boutique)
- **Testing**: Jest (backend), Playwright (e2e)
- **Infrastructure**: Docker Compose, Rafiki (ILP), Kratos (auth)

## Critical Setup Requirements

### Node.js Version (STRICT)

**Always use Node 20.12.1+**. The project will fail with other versions.

```bash
# Use NVM (recommended)
nvm install lts/iron
nvm use lts/iron

# Verify (must be v20.x)
node --version  # Should be v20.12.1 or later
```

### Package Manager (STRICT)

**ALWAYS use pnpm**. Running `npm install` will break the project. The root `package.json` has a `preinstall` hook that enforces this.

```bash
# Enable pnpm via Corepack (recommended)
corepack enable
corepack prepare pnpm@9.1.4 --activate

# Or install globally
npm install -g pnpm@9.1.4

# Install dependencies (always use --frozen-lockfile in CI)
pnpm install
```

## Workspace Structure

```
testnet/
├── packages/
│   ├── wallet/
│   │   ├── backend/       # Express GraphQL API, Rafiki integration
│   │   ├── frontend/      # Next.js 14 app (port 4003)
│   │   └── shared/        # Shared types/utils
│   ├── boutique/
│   │   ├── backend/       # Express API for e-commerce demo
│   │   ├── frontend/      # Vite + React app (port 4004)
│   │   └── shared/        # Shared types
│   └── shared/
│       └── backend/       # Common backend utilities
├── docker/
│   ├── dev/               # Local development environment
│   │   ├── docker-compose.yml
│   │   └── .env.example   # COPY to .env before starting
│   ├── prod/              # Production builds
│   └── dbinit.sql         # PostgreSQL initialization
├── .github/workflows/     # CI/CD pipelines
├── eslint.config.mjs      # ESLint 9+ flat config
├── .prettierrc.js         # Prettier config
├── tsconfig.json          # TypeScript project references
└── pnpm-workspace.yaml    # Workspace configuration
```

## Build & Development Workflow

### Build Order (CRITICAL)

Builds must follow dependency order. The `build:deps` scripts handle this automatically:

1. `@shared/backend` → 2. `@wallet/shared` / `@boutique/shared` → 3. Applications

**Always build from root or use package-specific commands:**

```bash
# Build all packages (recommended - handles deps automatically)
pnpm build

# Build specific package (deps handled automatically)
pnpm wallet:backend build
pnpm wallet:frontend build
pnpm boutique:backend build
pnpm boutique:frontend build
```

**DO NOT** run `tsc` directly in a package without building dependencies first.

### Local Development

**Three development modes** available via `DEV_MODE` environment variable:

```bash
# 1. Hot-reload (default) - backend auto-rebuilds on file changes
pnpm dev
# Starts: wallet-backend (3003), boutique-backend (3004), wallet-frontend (4003), boutique-frontend (4004)

# 2. Debug mode - exposes Node debugger ports
pnpm dev:debug
# Debugger ports: wallet-backend (9229), boutique-backend (9230)

# 3. Lite mode - runs production builds (faster startup, no hot-reload)
pnpm dev:lite
```

**Required before first run:**
```bash
# 1. Copy environment file
cp ./docker/dev/.env.example ./docker/dev/.env

# 2. Configure GateHub credentials in .env (contact team or use sandbox account)
# GATEHUB_ACCESS_KEY, GATEHUB_SECRET_KEY, etc.

# 3. Start development environment
pnpm dev
```

**Services after startup:**
- Wallet Frontend: http://localhost:4003
- Wallet Backend: http://localhost:3003
- Boutique Frontend: http://localhost:4004
- Boutique Backend: http://localhost:3004
- Wallet Admin: http://localhost:3012
- PostgreSQL: localhost:5433

### Stopping Development Environment

```bash
pnpm localenv:stop
```

## Testing

### Backend Tests (Jest)

```bash
# Run all tests
pnpm wallet:backend test
pnpm boutique:backend test

# Tests require built dependencies
pnpm wallet:backend build && pnpm wallet:backend test

# CI flags (used in GitHub Actions)
pnpm wallet:backend test --detectOpenHandles --forceExit
```

**Test Configuration**: `packages/*/backend/jest.config.json`  
**Test Setup**: `jest.setup.js` (database setup, mocks)  
**Module Aliases**: `@/` maps to `src/`, `@/tests/` maps to `tests/`

### End-to-End Tests (Playwright)

E2E tests are handled in the `testnet-deploy` repository, not here.

## Code Quality (Pre-commit Validation)

### Linting & Formatting

**ALWAYS run before committing:**

```bash
# Check formatting and linting
pnpm checks

# Auto-fix issues
pnpm format
```

**Individual commands:**
```bash
pnpm prettier:check    # Check formatting
pnpm prettier:write    # Auto-fix formatting
pnpm lint:check        # Check ESLint rules (max-warnings=0)
pnpm lint:fix          # Auto-fix ESLint issues
```

**Configuration:**
- ESLint: `eslint.config.mjs` (flat config, ESLint 9+)
- Prettier: `.prettierrc.js`
- DO NOT override configs in individual packages

### Common Linting Errors

**Error: "Unsupported environment (bad Node.js version)"**
- Run `nvm use` to switch to Node 20

**Error: "pnpm-lock.yaml is out of date"**
- Run `pnpm install` to update lockfile

**Prettier failures**
- Run `pnpm prettier:write` to auto-fix formatting

## CI/CD Pipeline

### GitHub Actions Workflows

**Special Notes**:
Agents should remind developers to keep the copilot-instructions.md file updated if they find discrepancies.

**PR Validation** (`.github/workflows/ci.yml`):
1. Runs `pnpm checks` (prettier + lint)
2. Conditional builds based on PR labels:
   - `package: wallet/frontend` → builds wallet frontend
   - `package: wallet/backend` → builds wallet backend + runs tests
   - Similar for boutique packages
3. Tests run **after** build with `--detectOpenHandles --forceExit`

**Build & Publish** (`.github/workflows/build-publish.yaml`):
- On tag `v*`: Builds and publishes Docker images to GHCR
- Matrix strategy builds all 4 packages in parallel
- Multiple deployment variants (test-wallet, test-wallet-cards, etc.)

**PR Title Check** (`.github/workflows/pr_title_check.yml`):
- Enforces [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): description`
- Examples: `feat(wallet): add KYC flow`, `fix(boutique): resolve checkout bug`

### Setup Action

The reusable setup action (`.github/workflows/setup/action.yml`) is used by all workflows:
1. Installs Node.js LTS Iron
2. Installs pnpm (version from `packageManager` field)
3. Configures pnpm store cache
4. Runs `pnpm install --frozen-lockfile`

## Common Issues & Solutions

### Build Failures

**Issue**: "Cannot find module '@shared/backend'"  
**Fix**: Build dependencies first: `pnpm build` from root

**Issue**: Next.js build fails with "Invalid Options: useEslintrc"  
**Status**: Known issue, safe to ignore if build completes. Related to ESLint 9 migration.

**Issue**: TypeScript errors in `dist/` folder  
**Fix**: Clean builds and rebuild: `pnpm clean:builds && pnpm build`

### Development Environment

**Issue**: Docker containers fail to start  
**Fix**: Ensure `.env` exists in `docker/dev/` and contains required GateHub credentials

**Issue**: "EADDRINUSE" port conflicts  
**Fix**: Stop existing services: `pnpm localenv:stop`, then restart

**Issue**: PostgreSQL connection errors  
**Fix**: Wait for postgres container to initialize (~10 seconds). Check `docker compose logs postgres`

**Issue**: Hot-reload not working  
**Fix**: Ensure `DEV_MODE=hot-reload` (default for `pnpm dev`). Lite mode doesn't have hot-reload.

### Testing

**Issue**: Tests hang and don't exit  
**Fix**: Use flags: `pnpm wallet:backend test --detectOpenHandles --forceExit`

**Issue**: Database errors in tests  
**Fix**: Ensure `jest.setup.js` is configured correctly and migrations have run

## Package Scripts Reference

**Root commands** (run from project root):
```bash
pnpm build              # Build all packages
pnpm checks             # Run prettier + lint checks
pnpm format             # Auto-fix formatting and linting
pnpm clean              # Clean node_modules and build artifacts
pnpm dev                # Start local environment (hot-reload)
pnpm dev:debug          # Start with debugger exposed
pnpm dev:lite           # Start production builds
```

**Package-specific** (shortcuts):
```bash
pnpm wallet:backend <cmd>    # Run command in wallet backend
pnpm wallet:frontend <cmd>   # Run command in wallet frontend
pnpm boutique:backend <cmd>  # Run command in boutique backend
pnpm boutique:frontend <cmd> # Run command in boutique frontend
```

## Docker Development Details

**Entrypoint Scripts**:
- `wallet-entrypoint.sh` and `boutique-entrypoint.sh` handle DEV_MODE switching
- Modes: `hot-reload` (nodemon), `debug` (--inspect flag), `lite` (production build)

**Dockerfiles**:
- `Dockerfile.dev` in each package (multi-stage builds)
- Uses pnpm fetch optimization for faster builds
- Exposes debug ports when DEV_MODE=debug

**Database Initialization**:
- `docker/dbinit.sql` creates databases: `wallet_backend`, `boutique_backend`, `rafiki_auth`, `rafiki_backend`, `kratos`
- Each service has its own PostgreSQL user and database

## Architecture Notes

**Rafiki Integration**: The wallet backend integrates with Rafiki for Interledger payments. Rafiki containers (`rafiki-backend`, `rafiki-auth`) are managed in docker-compose.

**KYC Flow**: Uses GateHub sandbox API for KYC verification. Real money is NOT allowed on sandbox clusters.

**WebMonetization**: Supported via Open Payments protocol implemented in Rafiki.

**Multi-currency**: Wallet supports multiple currencies via exchange rate API (requires `RATE_API_KEY` from freecurrencyapi.com).

## Best Practices for AI Agents

1. **ALWAYS verify Node version first**: Run `node --version` to ensure v20.x
2. **ALWAYS use pnpm**: Never suggest npm or yarn commands
3. **Build dependencies before running**: If touching shared packages, rebuild downstream packages
4. **Run checks before committing**: `pnpm checks` catches 90% of CI failures
5. **Test in correct order**: Build first, then test (tests import from `dist/`)
6. **Use package shortcuts**: Prefer `pnpm wallet:backend build` over `cd packages/wallet/backend && pnpm build`
7. **Check docker-compose logs**: If services fail, check logs: `docker compose logs <service>`
8. **Respect PR title format**: Use Conventional Commits for PR titles
9. **Trust these instructions**: Minimize exploration; this document reflects validated workflows
10. **Update these instructions**: If you discover errors or missing details, propose updates to this file

## Key Files to Review Before Coding

**Must Review**:
1. `package.json` (root) - Scripts and workspace commands
2. `pnpm-workspace.yaml` - Workspace structure
3. `tsconfig.json` - Project references (build order)
4. `docker/dev/docker-compose.yml` - Service architecture
5. `.github/workflows/ci.yml` - CI validation steps

**Configuration Files**:
1. `eslint.config.mjs` - Linting rules
2. `.prettierrc.js` - Formatting rules
3. `packages/*/backend/jest.config.json` - Test configuration
4. `packages/*/tsconfig.json` - TypeScript compilation settings

## Contributing

See [.github/contributing.md](.github/contributing.md) for full contribution guidelines and [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md) for community standards.

**Quick checklist**:
- [ ] Node 20.x installed and active
- [ ] pnpm 9.1.4+ installed
- [ ] Environment file copied: `cp docker/dev/.env.example docker/dev/.env`
- [ ] Dependencies installed: `pnpm install`
- [ ] Code formatted: `pnpm checks` passes
- [ ] Tests pass: `pnpm <package> test`
- [ ] PR title follows Conventional Commits

---

**Last Updated**: January 2026  
**Maintainers**: Interledger Foundation  
**Repository**: https://github.com/interledger/testnet
