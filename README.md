# Testnet

<img width="920" alt="testnet" src="https://user-images.githubusercontent.com/117268143/220323531-538238d2-f538-4ed5-be97-163e28ebc48f.jpg">

## What is Testnet?

Testnet is an open-source test application for Rafiki. In other words, a Rafiki Playground.
It wants to use all of the functionalities of Rafiki and put the advantages of it to the real test.

Testnet is made up (or will be made up in the near future) of several components, including wallet application,
a bank application, and an e-commerce application.

## What is Rafiki?

Rafiki is an open source package that exposes a comprehensive set of
Interledger APIs. It's intended to be run by wallet providers, allowing them to
offer Interledger functionality to their users.

### New to Interledger?

Never heard of Interledger before, or you would like to learn more? Here are some good places to start:

- [Good first issues](https://github.com/interledger/testnet/contribute)
- [Interledger Explainer Video](https://twitter.com/Interledger/status/1567916000074678272)
- [Interledger Website](https://interledger.org/rfcs/0027-interledger-protocol-4/)
- [Payment pointers](https://paymentpointers.org/)
- [Web monetization](https://webmonetization.org/)

## Contributing

Please read the [contribution guidelines](.github/contributing.md) before submitting contributions. All contributions must adhere to our [code of conduct](.github/CODE_OF_CONDUCT.md).

## Local Development Environment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [NVM](https://github.com/nvm-sh/nvm)

### Environment Setup

```sh
# Install Node 18
nvm install lts/hydrogen
nvm use lts/hydrogen

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

### Local Playground

Navigate to the project's root directory and execute:

```sh
pnpm dev
```

Upon executing the above command, the following will be available

- Wallet application
  - Frontend at [http://localhost:4003](http://localhost:4003)
  - Backend at [http://localhost:3003](http://localhost:3003)
