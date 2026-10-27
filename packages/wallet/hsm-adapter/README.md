# @wallet/hsm-adapter

Two small applications, `hsm-adapter-issuer` and `hsm-adapter-merchant`. Each
runs one of the published [hsm-adapter-ts](https://github.com/interledger/hsm-adapter-ts)
gRPC servers in its own process, with one connection to the Atalla HSM. The
TestNet Wallet is the Account Servicing Entity for both card roles, so it
runs both:

| Application            | Package                            | gRPC port | Called by    |
| ---------------------- | ---------------------------------- | --------- | ------------ |
| `hsm-adapter-issuer`   | `@interledger/hsm-atalla-issuer`   | 50051     | issuer-api   |
| `hsm-adapter-merchant` | `@interledger/hsm-atalla-merchant` | 50052     | merchant-api |

The real HSM accepts two connections from one public IP: one for each
process. The wallet backend does not connect to the HSM.

## What the wrapper adds

The packages are used as published, at 0.3.0. The wrapper only:

- reads the configuration from the environment;
- fixes the connection pool at one connection;
- owns the HSM transport and gives it to the server (the `transport` server
  option). The server does not connect or close a transport it did not
  create;
- connects to the HSM first, then opens the gRPC port, then passes a health
  check, all within `START_TIMEOUT_MS`. Otherwise it exits 1. The transport
  never gives up on a connection that fails, so Kubernetes does the back-off.
  The readiness probe checks the gRPC port, so the pod is ready only once the
  HSM answered;
- logs the Connect code of each call at `debug`, through a Connect
  interceptor (the `interceptors` server option). The library already logs
  each call at `info`, but not the code the caller sees. Neither logs a
  request or a response;
- on SIGTERM or SIGINT, stops the server, then closes the transport, and
  exits after `STOP_TIMEOUT_MS` at the latest.

The image runs Node 24. There, the server's stop sends GOAWAY to open HTTP/2
sessions: calls in flight finish, and new calls are refused.

It does not reconnect with back-off, report readiness from the connection
state, or map HSM errors to gRPC codes. Those belong in hsm-adapter-ts
(HSM-51). After start-up, a lost connection is retried by the library's pool.

## Configuration

| Variable                            | Default                              | Meaning                                |
| ----------------------------------- | ------------------------------------ | -------------------------------------- |
| `ATALLA_HOST`                       | — (required)                         | The HSM host                           |
| `ATALLA_PORT`                       | — (required)                         | The HSM port                           |
| `ATALLA_TIMEOUT_MS`                 | `2000`                               | How long one HSM command may take      |
| `ATALLA_TLS_ENABLED`                | `false`                              | Mutual TLS to the HSM                  |
| `ATALLA_CA_CERT_PATH`               | `/etc/atalla/tls/ca.crt`             | With TLS: the CA                       |
| `ATALLA_CLIENT_CERT_PATH`           | `/etc/atalla/tls/client.crt`         | With TLS: the client certificate       |
| `ATALLA_CLIENT_KEY_PATH`            | `/etc/atalla/tls/client.key`         | With TLS: the client key               |
| `ATALLA_SKIP_SERVER_IDENTITY_CHECK` | `false`                              | With TLS: skip the hostname check only |
| `GRPC_HOST`                         | `0.0.0.0`                            | Listen address                         |
| `GRPC_PORT`                         | `50051` (issuer), `50052` (merchant) | Listen port                            |
| `START_TIMEOUT_MS`                  | `15000`                              | See above                              |
| `STOP_TIMEOUT_MS`                   | `10000`                              | See above                              |
| `LOG_LEVEL`                         | `info`                               | pino level                             |

## Build and test

```bash
pnpm wallet:hsm-adapter typecheck
pnpm wallet:hsm-adapter test    # unit tests, with an 80 % coverage gate
pnpm wallet:hsm-adapter build
```

The tests run on `node:test`, not Jest. The `@interledger/hsm-atalla-*`
packages depend on ESM-only packages, which the Jest CommonJS resolver cannot
load.

To run one against a local HSM or the simulator:

```bash
ATALLA_HOST=localhost ATALLA_PORT=13506 pnpm wallet:hsm-adapter dev:merchant
```

One Dockerfile builds both images, from the repository root:

```bash
docker build -f packages/wallet/hsm-adapter/Dockerfile.prod --target issuer   -t test-wallet-hsm-adapter-issuer .
docker build -f packages/wallet/hsm-adapter/Dockerfile.prod --target merchant -t test-wallet-hsm-adapter-merchant .
```

## Deploy

The `testnet-wallet` chart runs both, as the Deployments and Services
`<fullname>-hsm-adapter-issuer` and `<fullname>-hsm-adapter-merchant`. See
`hsmAdapter` in [`helm/testnet-wallet/values.yaml`](../../../helm/testnet-wallet/values.yaml).
They are off by default. Each uses `Recreate`, so an update never holds two
connections to one HSM.
