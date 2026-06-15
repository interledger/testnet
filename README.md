# Test Network

<a href="#what-is-test-network">
  <img src="https://user-images.githubusercontent.com/117268143/220323531-538238d2-f538-4ed5-be97-163e28ebc48f.jpg" width="920" alt="Test wallet picture">
</a>

## What is Test Network?

Test Network is an open Interledger network working with test money designed for account servicing entities to test their Interledger integration.

Test Network currently includes an Interledger Test Wallet application, an e-commerce application and in the near future, a bank application.

If you are curious about the Interledger Test Wallet architecture diagram, then follow this [link](.github/TESTNET_architecture.md).

See Test Network in action:

- [Interledger Test Wallet](https://wallet.interledger-test.dev)
- [Interledger Test E-Commerce - Boutique](https://boutique.interledger-test.dev)

## What is Rafiki?

Rafiki is open source software that provides an efficient solution for an [account servicing entity](https://rafiki.dev/resources/glossary#account-servicing-entity-ase) to enable Interledger functionality on its users' accounts.

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Interledger Website](https://interledger.org/)
- [Interledger Specs](https://interledger.org/developers/get-started/)
- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Open Payments](https://openpayments.dev/)
- [Web Monetization](https://webmonetization.org/)

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Releases

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) with [Conventional Commits](https://www.conventionalcommits.org/). PR titles are automatically validated to follow the `type(scope): description` format.

Releases are created manually by running the **Create Release** workflow from the GitHub Actions UI. Selecting `main` cuts a regular release; selecting a `release/vX.Y` branch cuts a patch-only maintenance release.

| Commit prefix                  | Version bump    |
| ------------------------------ | --------------- |
| `fix:`                         | Patch (`1.0.x`) |
| `feat:`                        | Minor (`1.x.0`) |
| `feat!:` / `BREAKING CHANGE:`  | Major (`x.0.0`) |
| `chore:`, `docs:`, `ci:`, etc. | Patch           |

## Local Development Environment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [NVM](https://github.com/nvm-sh/nvm)
- [GateHub](https://sandbox.gatehub.net) account in Sandbox mode

### Environment Setup

```sh
# Install Node 20
nvm install lts/iron
nvm use lts/iron

# Install pnpm using Corepack
corepack enable
```

If you do not have `corepack` installed locally you can use `npm` or `yarn` to install `pnpm`:

```sh
npm install pnpm -g
# or
yarn install pnpm -g
```

For alternative methods of installing `pnpm`, you can refer to the [official `pnpm` documentation](https://pnpm.io/installation).

To install dependencies, execute:

```sh
pnpm i
```

### Environment Variables

In order for the Test Wallet and Test e-commerce playground to function, it is necessary to configure the environment variables appropriately. You must duplicate the example environment file, `.env.example`, into your local environment file, `.env`.

> **Note**
> The local environment file (`.env`) is **NOT** tracked in the version control system, and should **NOT** be included in any commits.

Navigate to the project's root directory and enter the following command:

```sh
cp ./local/.env.example ./local/.env
```

Using your preferred text editor, open the `./local/.env` file and configure the necessary environment variables.
The `GATEHUB` related environment variables are necessary in order to complete Sandbox KYC, and add play money to your account. In order to have the correct variables, create a `GateHub` Sandbox account. Optionally you could send an email to `timea@interledger.foundation` and request these variables.

To create a new Interledger Test Wallet account, a verification email will be sent to the provided email address. In the local environment, `SEND_EMAIL` defaults to `false` so no email is actually sent — the verification link is printed to the backend log instead. If you want to use Sendgrid, set `SEND_EMAIL=true` and `SENDGRID_API_KEY` in `packages/wallet/backend/.env`.

To enable rate limiter on the wallet for security purposes you can set these environment variables: `RATE_LIMIT` to `true` and `RATE_LIMIT_LEVEL`. `RATE_LIMIT_LEVEL` has three possible values: `LAX|NORMAL|STRICT`, default is `LAX`.

Cross-currency transactions are supported. To enable this functionality, you will need to register at [freecurrencyapi.com/](https://freecurrencyapi.com/) and update the `RATE_API_KEY` environment variable with your own API key.
Currencies can be added in the `admin` environment. For example `assetCode` is `EUR`, `assetScale` is `2`, and you will need to add an amount to `liquidity`.

If you would like to set up e-commerce application, you will need to create a USD Wallet Address (payment pointer), then generate public and private key for the wallet address in the `Developer Keys` found in the `Settings` menu of Interledger Test Wallet. You also need to update the following environment variables: `PRIVATE_KEY` to the generated base64 encoded private key, `KEY_ID` to the wallet address key id and `PAYMENT_POINTER` to the created wallet address (payment pointer) address.

### Local Playground

For a quick command list:

```sh
pnpm local:help
```

Recommended first-run startup order:

```sh
# Clean environment
pnpm clean

# Install dependencies
pnpm i

# Build all packages (required before first run)
pnpm build

# Setup will do the following tasks in one go
# - Add custom hostnames to /etc/hosts (needs admin password)
# - Generate self signed certificates for local env SSL
# - Add self signed certificates to OS cert store
# - Build and launch containers required to run environment
pnpm run local:setup

# Starts TestNet Wallet and Boutique in development mode
pnpm run dev
```

Notes:

- `pnpm local:setup` will ask for sudo password
- Setup can be re-run safely without concerns
- Configurations can be found in the `.env.local` files.
- See `.env.example` files for available environment overrides. Values placed in `.env` will override local environment.
- Boutique will not be able to transact until you set up developer keys against the TestNet Wallet and configure the `.env` file

Upon executing the above commands the following will be available:

- [https://auth.testnet.test](https://auth.testnet.test) - Local authentication service.
- [https://testnet.test](https://testnet.test) - Test Wallet frontend.
- [https://api.testnet.test](https://api.testnet.test) - Wallet backend API for the local Test Wallet environment.
- [https://boutique.test](https://boutique.test) - Boutique frontend.
- [https://api.boutique.test](https://api.boutique.test) - Boutique backend API serving product and checkout functionality.
- [https://mockgatehub.testnet.test](https://mockgatehub.testnet.test) - Mock GateHub service used for local funding and related sandbox flows.
- [https://rafiki-frontend.testnet.test](https://rafiki-frontend.testnet.test) - Rafiki frontend UI.
- [https://rafiki-backend.testnet.test](https://rafiki-backend.testnet.test) - Rafiki backend service.

## E2E Tests

End-to-end tests use [Playwright](https://playwright.dev/) with [playwright-bdd](https://vitalets.github.io/playwright-bdd/) (Gherkin feature files). They run against the local environment and require the full stack to be up (`pnpm run local:setup && pnpm run dev`).

```sh
# Install Playwright browsers (first time only)
pnpm e2e:install

# Run all e2e tests (headless)
pnpm e2e:test

# Run all e2e tests (headed — watch the browser)
pnpm e2e:test:headed
```

Feature files are in `e2e/features/`. No `.env` file is required — the tests default to `https://testnet.test`. Override via `e2e/.env` if needed (see `e2e/.env.example`). See [e2e/README.md](e2e/README.md) for details on how email verification and account isolation work.
