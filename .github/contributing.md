# Contributing to this repository <!-- omit in toc -->

## Getting started <!-- omit in toc -->

Thank you for contributing to Testnet, a Rafiki Playground :tada:

Before you begin:
- Have you read the [code of conduct](CODE_OF_CONDUCT.md)?
- Check out the [existing issues](https://github.com/interledger/testnet/issues) & see if we [accept contributions](#types-of-contributions) for your type of issue.

### Table of Contents <!-- omit in toc -->

- [Types of contributions](#types-of-contributions)
  - [:mega: Discussions](#mega-discussions)
  - [:beetle: Issues](#beetle-issues)
  - [:hammer\_and\_wrench: Pull requests](#hammer_and_wrench-pull-requests)
  - [:books: Documentation](#books-documentation)
- [Working in the testnet repository](#working-in-the-testnet-repository)
  - [Labels](#labels)
  - [Code quality](#code-quality)
    - [Linting](#linting)
    - [Formatting](#formatting)
    - [Testing](#testing)
    - [Language](#language)
    - [CI](#ci)

## Types of contributions
You can contribute to Testnet in several ways. 

### :mega: Discussions
Discussions are where we have conversations about Testnet.

If you would like to discuss topics about the broader ecosystem, have a new idea, or want to show off your work - join us in [discussions](https://github.com/interledger/testnet/discussions).

### :beetle: Issues
We use GitHub issues to track tasks that contributors can help with. We haven't finalized labels yet for contributors to tackle. If you want to help with work related to an issue, please comment on the issue before starting work on it.

If you've found something that needs fixing, search open issues to see if someone else has reported the same thing. If it's something new, open an issue. We'll use the issue to discuss the problem you want to fix.

### :hammer_and_wrench: Pull requests
Feel free to fork and create a pull request on changes you think you can contribute.

The team will review your pull request as soon as possible.

### :books: Documentation
The project is new and available Testnet documentation is a work in progress.

Rafiki has started to maintain public-facing documentation on [rafiki.dev](https://github.com/interledger/rafiki.dev). 
A list of issues being tracked across the Interledger ecosystem (including rafiki) is maintained in the [Documentation project](https://github.com/orgs/interledger/projects/5/views/1).


## Working in the Testnet repository

This project uses `pnpm`. A list of steps for setting up a [local development environment](https://github.com/interledger/testnet#local-development-environment) can be found in the Readme.

> **Warning**
> DO NOT use `npm install`. This will cause the project to spontaneously self-destruct :boom:.

### Labels

We use labels to communicate the intention of issues and PRs.

- `package: wallet/*` prefix denotes issues that are partaining the wallet application (frontend and backend);
- `priority:` prefix denotes pirority of issues.
- `type:` prefix denotes the type of issues/PRs, ex. type:story represents a bigger issue with subtasks.

Some labels will be automatically assigned to issues/PRs.

### Code quality

All the code quality tools used in the project are installed and configured at the root.
This allows for consistency across the monorepo. Allows new packages to be added with
minimal configuration overhead.

We try not to put config files in workspaces, unless absolutely necessary.

#### Linting

[Eslint](https://eslint.org/) is used for linting.

```shell
./.eslintrc.js # config
./.eslintignore # ignore file
```

Eslint config should not be overridden in any packages.

#### Formatting

[Prettier](https://prettier.io/) is used for formatting.

```shell
./.prettierrc.js # config
./.prettierignore # ignore file
```

Prettier config should not be overridden in any packages.

#### Testing

[Jest](https://jestjs.io/) is used for unit and integration testing.

[Playwright](https://playwright.dev/) is used for end-to-end testing.

#### Language

[Typescript](https://www.staging-typescript.org/) is the chosen language.

```shell
./tsconfig.base.json # config
```

Typescript config at the root is intended to be a base config that should be extended by
each package to suit the package's requirements.

#### CI

We use GitHub actions to manage our CI pipeline.

The workflows can be found in `.github/workflows`
