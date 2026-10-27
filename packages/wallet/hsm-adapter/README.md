# @wallet/hsm-adapter

Two small applications, `hsm-adapter-issuer` and `hsm-adapter-merchant`. Each
runs one of the published [hsm-adapter-ts](https://github.com/interledger/hsm-adapter-ts)
gRPC servers in its own process, with one connection to the Atalla HSM.
TestNet Wallet is the FSP (Financial Service Provider) for both roles, so it
runs both:

| Application            | Package                            | gRPC port | Called by    |
| ---------------------- | ---------------------------------- | --------- | ------------ |
| `hsm-adapter-issuer`   | `@interledger/hsm-atalla-issuer`   | 50051     | issuer-api   |
| `hsm-adapter-merchant` | `@interledger/hsm-atalla-merchant` | 50052     | merchant-api |

## Configuration

Each application reads one YAML file, named by `HSM_ADAPTER_CONFIG_PATH`:

```yaml
log:
  level: info
grpc:
  host: 0.0.0.0
  port: 50051 # 50052 for the merchant
atalla:
  host: 10.0.0.1 # required
  port: 13506 # required
  timeout_ms: 2000
  tls:
    enabled: false
    ca_cert_path: /etc/atalla/tls/ca.crt
    client_cert_path: /etc/atalla/tls/client.crt
    client_key_path: /etc/atalla/tls/client.key
    skip_server_identity_check: false
start_timeout_ms: 15000
stop_timeout_ms: 10000
```

The values shown are the defaults, except `atalla.host` and `atalla.port`.
