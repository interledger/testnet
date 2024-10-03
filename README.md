# Test Network

<a href="#what-is-test-network">
  <img src="https://user-images.githubusercontent.com/117268143/220323531-538238d2-f538-4ed5-be97-163e28ebc48f.jpg" width="920" alt="Test wallet picture">
</a>

## What is Test Network?

Test Network is an open Interledger network working with test money designed for account servicing entities to test their Interledger integration.

Test Network currently includes an Interledger Test Wallet application, an e-commerce application and in the near future, a bank application.

If you are curious about the Interledger Test Wallet architecture diagram, then follow this [link](.github/TESTNET_architecture.md).

See Test Network in action:

- [Interledger Test Wallet](https://rafiki.money)
- [Interledger Boutique](https://rafiki.boutique)

## What is Rafiki?

[Rafiki](https://github.com/interledger/rafiki) is an open-source package that exposes a comprehensive set of
Interledger APIs. It's intended to be run by wallet providers, allowing them to
offer Interledger functionality to their users.

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Good first issues](https://github.com/interledger/testnet/contribute)
- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Interledger Website](https://interledger.org)
- [Payment pointers](https://paymentpointers.org/)
- [Web monetization](https://webmonetization.org/)

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Local Development Environment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [NVM](https://github.com/nvm-sh/nvm)
- [Rapyd](https://www.rapyd.net) account in Sandbox mode

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
cp ./docker/dev/.env.example ./docker/dev/.env
```

Using your preferred text editor, open the `./docker/dev/.env` file and configure the necessary environment variables.
The `RAPYD_ACCESS_KEY` and `RAPYD_SECRET_KEY` variables values can be found in your Rapyd Sandbox account (you need to create an account at [rapyd.net](https://www.rapyd.net)), under the Developers menu item. The `RAPYD_SETTLEMENT_EWALLET` variable value can be found in your Rapyd Sandbox account details.

To create a new Interledger Test Wallet account, a verification email will be sent to the provided email address. If you want to send emails within the development environment, you will need to have a personal Sendgrid account and update the following environment variables: `SEND_EMAIL` to `true`, `SENDGRID_API_KEY` and `FROM_EMAIL`. If you prefer not to send emails in the development environment, simply set `SEND_EMAIL` to `false` and use the verification link found in the Docker `wallet-backend` container logs to finalize the registration process for a new user.

To enable rate limiter on the wallet for security purposes you can set these environment variables: `RATE_LIMIT` to `true` and `RATE_LIMIT_LEVEL`. `RATE_LIMIT_LEVEL` has three possible values: `LAX|NORMAL|STRICT`, default is `LAX`.

Cross-currency transactions are supported. To enable this functionality, you will need to register at [freecurrencyapi.com/](https://freecurrencyapi.com/) and update the `RATE_API_KEY` environment variable with your own API key.
Currencies can be added in the `admin` environment. For example `assetCode` is `EUR`, `assetScale` is `2`, and you will need to add an amount to `liquidity`.

To have everything ready for `DEV` environment, we already set up some default values for Interledger Test Wallet, this way developers are ready to login without validation, and test e-commerce application without any additional setup:

- a `USD` asset set by default in the `admin` environment
- a user with email address `dev@email.com` and password `123456`, with a `USD` account, payment pointer and test money
- a user with email address `boutique@email.com` and password `123456`, with a `USD` account and a payment pointer `boutique`, which is used as a receiver payment pointer at the e-commerce application
- developer keys for the `boutique` payment pointer, these values will be copied to `.env` file from `.env.example`, as mentioned above

If you would like to set up e-commerce application manually for another payment pointer, you will need to create a USD payment pointer, then generate public and private key for the payment pointer in the `Developer Keys` found in the `Settings` menu of Interledger Test Wallet. You also need to update the following environment variables: `PRIVATE_KEY` to the generated base64 encoded private key, `KEY_ID` to the payment pointer key id and `PAYMENT_POINTER` to the created payment pointer address.

### Local Playground

Navigate to the project's root directory and execute:

```sh
pnpm dev
```

Upon executing the above command, the following will be available

- Interledger Test Wallet application

  - Frontend at [http://localhost:4003](http://localhost:4003)
  - Backend at [http://localhost:3003](http://localhost:3003)
  - Admin at [http://localhost:3012](http://localhost:3012)

- Interledger Boutique e-commerce application
  - [http://localhost:4004](http://localhost:4004)
