# MockGatehub

A lightweight Golang implementation of the Gatehub API designed for local development and testing of the Interledger TestNet wallet application.

## Overview

MockGatehub provides a drop-in replacement for Gatehub's sandbox environment, enabling developers to:
- Develop and test wallet integrations without real Gatehub credentials
- Run the complete TestNet stack locally
- Test multi-currency operations (11 supported currencies)
- Verify KYC flows with auto-approval
- Test webhook delivery mechanisms

## Features

- **Full API Coverage**: Authentication, KYC, wallets, transactions, rates, and cards (stubbed)
- **Multi-Currency Support**: XRP, USD, EUR, GBP, ZAR, MXN, SGD, CAD, EGG, PEB, PKR
- **Auto-KYC Approval**: Automatic verification in sandbox mode
- **Webhook Delivery**: Asynchronous webhook events with HMAC signatures
- **Dual Storage**: In-memory (tests) and Redis (runtime) backends
- **Pre-seeded Users**: Test users with balances ready to use

## Quick Start

### Running with Docker Compose

```bash
cd docker/local
docker-compose up mockgatehub
```

The service will be available at `http://localhost:8080`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCKGATEHUB_PORT` | `8080` | HTTP server port |
| `MOCKGATEHUB_REDIS_URL` | - | Redis connection URL (optional) |
| `MOCKGATEHUB_REDIS_DB` | `0` | Redis database number |
| `WEBHOOK_URL` | - | Wallet backend webhook endpoint |
| `WEBHOOK_SECRET` | - | Secret for signing webhooks |

### Pre-seeded Test Users

Two test users are automatically created:

**testuser1@mockgatehub.local**
- User ID: `00000000-0000-0000-0000-000000000001`
- Initial Balance: 10,000 USD
- KYC Status: Verified

**testuser2@mockgatehub.local**
- User ID: `00000000-0000-0000-0000-000000000002`
- Initial Balance: 10,000 EUR
- KYC Status: Verified

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Authentication (`/auth/v1/`)
- `POST /tokens` - Generate access token
- `POST /users/managed` - Create managed user
- `GET /users/managed` - Get managed user by email
- `PUT /users/managed/email` - Update user email

### Identity/KYC (`/id/v1/`)
- `GET /users/{userID}` - Get user state
- `POST /users/{userID}/hubs/{gatewayID}` - Start KYC process
- `PUT /hubs/{gatewayID}/users/{userID}` - Update KYC state

### Wallets & Transactions (`/core/v1/`)
- `POST /wallets` - Create new wallet
- `GET /wallets/{address}` - Get wallet details
- `GET /wallets/{address}/balance` - Get multi-currency balance
- `POST /transactions` - Create deposit/transaction
- `GET /transactions/{txID}` - Get transaction details

### Rates (`/rates/v1/`)
- `GET /rates/current` - Get current exchange rates
- `GET /liquidity_provider/vaults` - Get vault UUIDs

### Cards (`/cards/v1/`) - Stubs
- `POST /customers/managed` - Create card customer (stub)
- `POST /cards` - Create card (stub)
- `GET /cards/{cardID}` - Get card (stub)
- `DELETE /cards/{cardID}` - Delete card (stub)

## Supported Currencies

| Currency | Code | Vault UUID |
|----------|------|------------|
| US Dollar | USD | 450d2156-132a-4d3f-88c5-74822547658d |
| Euro | EUR | a09a0a2c-1a3a-44c5-a1b9-603a6eea9341 |
| British Pound | GBP | 8c3e4d5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f |
| South African Rand | ZAR | 9d4f5e6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a |
| Mexican Peso | MXN | 0e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b |
| Singapore Dollar | SGD | 1f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c |
| Canadian Dollar | CAD | 2a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d |
| EGG (Test) | EGG | 3b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e |
| PEB (Test) | PEB | 4c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f |
| Pakistani Rupee | PKR | 5d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a |
| XRP | XRP | 6e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b |

## Webhook Events

MockGatehub sends the following webhook events:

### `id.verification.accepted`
Sent when KYC verification is approved (automatic in sandbox mode)

```json
{
  "event_type": "id.verification.accepted",
  "user_uuid": "user-id",
  "timestamp": "2026-01-20T10:00:00Z",
  "data": {
    "message": "User verification accepted"
  }
}
```

### `core.deposit.completed`
Sent when an external deposit completes

```json
{
  "event_type": "core.deposit.completed",
  "user_uuid": "user-id",
  "timestamp": "2026-01-20T10:00:00Z",
  "data": {
    "transaction_id": "tx-id",
    "amount": 100.00,
    "currency": "USD"
  }
}
```

## Development

### Prerequisites

- Go 1.24+
- Docker & Docker Compose
- Redis (optional, for persistent storage)

### Building Locally

```bash
cd packages/mockgatehub
go mod download
go build -o mockgatehub ./cmd/mockgatehub
./mockgatehub
```

### Running Tests

```bash
go test ./...
```

### Running with Coverage

```bash
go test -cover ./...
```

## Architecture

MockGatehub follows a clean architecture pattern:

```
cmd/mockgatehub/          # Application entry point
internal/
  ├── auth/               # HMAC signature validation
  ├── consts/             # Constants (currencies, vault IDs)
  ├── handler/            # HTTP request handlers
  ├── logger/             # Logging utilities
  ├── models/             # Domain models
  ├── storage/            # Storage layer (interface + implementations)
  ├── utils/              # Utilities (UUID, address generation)
  └── webhook/            # Webhook delivery system
web/                      # Static assets (KYC iframe)
```

### Storage Backends

**In-Memory Storage** (for tests):
- Fast, no dependencies
- Data lost on restart
- Thread-safe with sync.RWMutex

**Redis Storage** (for runtime):
- Persistent across restarts
- Supports distributed deployments
- JSON serialization for complex objects

## Limitations

- **Sandbox Only**: Designed for development, not production use
- **Happy Paths**: Focuses on successful flows; limited error scenarios
- **No Authentication**: HMAC signature validation is implemented but not enforced by default
- **Card Endpoints**: Stubbed with minimal functionality
- **No Rate Limiting**: Suitable for development only

## Troubleshooting

### Container won't start
```bash
docker-compose logs mockgatehub
```

### Check Redis connection
```bash
redis-cli -n 1 KEYS "balance:*"
```

### Test health endpoint
```bash
curl http://localhost:8080/health
```

### View webhook delivery logs
Check wallet-backend logs for incoming webhooks:
```bash
docker-compose logs wallet-backend | grep webhook
```

## Contributing

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for implementation roadmap and [AGENTS.md](AGENTS.md) for AI agent development guidelines.

## License

Part of the Interledger TestNet project. See LICENSE in the repository root.
