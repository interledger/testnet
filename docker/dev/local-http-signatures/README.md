# Local HTTP Signatures

This is an app that generates HTTP digests and signatures for Postman, using the [@interledger/http-signature-utils](https://github.com/interledger/open-payments/tree/main/packages/http-signature-utils) package.

## Local Development

### Usage

From the monorepo root directory:

```shell
pnpm --filter local-http-signatures start
```

## Running the Postman signature app

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) configured to [run as non-root user](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user)

### Docker build

In order to build the docker container to run the signature app, run the following command.

```shell
# from the root
docker build -f docker/dev/local-http-signatures/Dockerfile -t rafiki-local-http-signatures .
```

The following environment variables can be set.

| Name     | Description                | Note                                                  |
| -------- | -------------------------- | ----------------------------------------------------- |
| KEY_FILE | `/PATH/TO/private-key.pem` | Key file needs to be copied into the docker container |
