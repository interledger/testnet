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

- reads the configuration from one YAML file;
- fixes the connection pool at one connection;
- owns the HSM transport and gives it to the server (the `transport` server
  option). The server does not connect or close a transport it did not
  create;
- connects to the HSM first, then opens the gRPC port, then passes a health
  check, all within `start_timeout_ms`. Otherwise it exits 1. The transport
  never gives up on a connection that fails, so Kubernetes does the back-off.
  The readiness probe checks the gRPC port, so the pod is ready only once the
  HSM answered;
- logs the Connect code of each call at `debug`, through a Connect
  interceptor (the `interceptors` server option). The library already logs
  each call at `info`, but not the code the caller sees. Neither logs a
  request or a response;
- on SIGTERM or SIGINT, stops the server, then closes the transport, and
  exits after `stop_timeout_ms` at the latest.

The image runs Node 24. There, the server's stop sends GOAWAY to open HTTP/2
sessions: calls in flight finish, and new calls are refused.

It does not reconnect with back-off, report readiness from the connection
state, or map HSM errors to gRPC codes. Those belong in hsm-adapter-ts
(HSM-51). After start-up, a lost connection is retried by the library's pool.

## Configuration

The adapter reads one YAML file, and no other settings from the environment.
`HSM_ADAPTER_CONFIG_PATH` names the file. Unknown keys are rejected, so a typo
stops the start instead of being ignored. Numbers must be numbers, not quoted
strings.

```yaml
log:
  level: info # pino level. Default info.
grpc:
  host: 0.0.0.0 # Listen address. Default 0.0.0.0.
  port: 50051 # Default 50051 (issuer), 50052 (merchant).
atalla:
  host: 10.0.0.1 # Required.
  port: 13506 # Required.
  timeout_ms: 2000 # How long one HSM command may take. Default 2000.
  tls:
    enabled: true # Mutual TLS to the HSM. Default false.
    # Paths, not PEM text. A relative path resolves against the directory of
    # this file. These are the defaults.
    ca_cert_path: /etc/atalla/tls/ca.crt
    client_cert_path: /etc/atalla/tls/client.crt
    client_key_path: /etc/atalla/tls/client.key
    # Skips the hostname check only. Default false.
    skip_server_identity_check: false
start_timeout_ms: 15000 # See above. Default 15000.
stop_timeout_ms: 10000 # See above. Default 10000.
```

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
printf 'atalla:\n  host: localhost\n  port: 13506\n' > /tmp/hsm-adapter.yaml
HSM_ADAPTER_CONFIG_PATH=/tmp/hsm-adapter.yaml pnpm wallet:hsm-adapter dev:merchant
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
