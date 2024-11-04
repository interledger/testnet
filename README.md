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
cp ./docker/dev/.env.example ./docker/dev/.env
```

Using your preferred text editor, open the `./docker/dev/.env` file and configure the necessary environment variables.
The `GATEHUB` related environment variables are necessary in order to complete Sandbox KYC, and add play money to your account. In order to have the correct variables, create a `GateHub` Sandbox account. Optionally you could send an email to `timea@interledger.foundation` and request these variables.

To create a new Interledger Test Wallet account, a verification email will be sent to the provided email address. If you want to send emails within the development environment, you will need to have a personal Sendgrid account and update the following environment variables: `SEND_EMAIL` to `true`, `SENDGRID_API_KEY` and `FROM_EMAIL`. If you prefer not to send emails in the development environment, simply set `SEND_EMAIL` to `false` and use the verification link found in the Docker `wallet-backend` container logs to finalize the registration process for a new user.

Cross-currency transactions are supported. To enable this functionality, you will need to register at [freecurrencyapi.com/](https://freecurrencyapi.com/) and update the `RATE_API_KEY` environment variable with your own API key.
Currencies can be added in the `admin` environment. For example `assetCode` is `EUR`, `assetScale` is `2`, and you will need to add an amount to `liquidity`.

If you would like to set up e-commerce application, you will need to create a USD payment pointer, then generate public and private key for the payment pointer in the `Developer Keys` found in the `Settings` menu of Interledger Test Wallet. You also need to update the following environment variables: `PRIVATE_KEY` to the generated base64 encoded private key, `KEY_ID` to the payment pointer key id and `PAYMENT_POINTER` to the created payment pointer address.

### Local Playground

Navigate to the project's root directory and execute:

```sh
pnpm dev #this will start the project in hot reload mode for backend containers. Frontend containers have hot reload functionality enabled on all dev commads
```

other options to start the local env are:

```sh
pnpm dev:debug #backend containers will not have hot reload feture enabled but will expose and have node `--inspect` option set with wallet container debug port set to 9229 and boutique port set to 9230. Once the containers are running, you can connect your debugger (e.g., Chrome DevTools, VS Code)
```

and:

```sh
pnpm dev:lite #backend containers will build and run the builds, no debug and no hot reload for these containers
```

Upon executing the above command, the following will be available

- Interledger Test Wallet application

  - Frontend at [http://localhost:4003](http://localhost:4003)
  - Backend at [http://localhost:3003](http://localhost:3003)
  - Admin at [http://localhost:3012](http://localhost:3012)

- Interledger Boutique e-commerce application
  - [http://localhost:4004](http://localhost:4004)
