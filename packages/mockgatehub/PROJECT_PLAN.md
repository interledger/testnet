# MockGatehub Implementation Plan

## Implementation Status
- ✅ Phase 1: Project Foundation
- ✅ Phase 2: Core Authentication & Storage  
- ✅ Phase 3: API Endpoints (Auth, Identity, Core, Rates, Cards)
- ✅ Phase 4: Redis Storage & Configuration
- ✅ Phase 5: Webhook System with HMAC signatures & retries
- ✅ Phase 6: Enhanced Logging & Integration Testing
- ✅ Phase 7: Docker Integration Testing
- ✅ Phase 8: Full Stack Integration & testenv/
- 🔄 Phase 9: Documentation & Validation (NEXT)
- ⏳ Phase 10: Final Testing & Handoff

## Test Results
**Total: 29/29 tests passing** ✅
- Phase 1-3: 16 tests (auth + storage + API)
- Phase 5: 7 webhook tests
- Phase 6: 4 handler tests + 2 integration tests

## Overview
MockGatehub is a lightweight Golang implementation of the Gatehub API designed to enable local development and testing of the TestNet wallet application without requiring real Gatehub credentials or services.

## Project Goals
1. **Drop-in Replacement**: No changes to existing wallet code
2. **Sandbox Parity**: Mimic Gatehub sandbox environment behavior
3. **Testing Support**: In-memory storage for unit tests, Redis for runtime
4. **Complete Happy Paths**: Full KYC auto-approval, deposits, multi-currency support
5. **Webhook Support**: Async delivery with HMAC signatures

## Phase 1: Project Foundation ✅

### Directory Structure
```
packages/mockgatehub/
├── cmd/mockgatehub/           # Entry point
├── internal/
│   ├── auth/                  # HMAC signature validation
│   ├── models/                # Domain & API models
│   ├── storage/               # Storage layer (interface, memory, Redis)
│   ├── handler/               # HTTP handlers
│   ├── webhook/               # Webhook delivery
│   ├── consts/                # Constants (vaults, currencies)
│   ├── utils/                 # Utilities (UUID, addresses)
│   └── logger/                # Logging
├── web/                       # KYC iframe HTML
├── Dockerfile
├── go.mod
├── go.sum
├── README.md
├── AGENTS.md
└── PROJECT_PLAN.md
```

### Dependencies
- `github.com/go-chi/chi/v5` - HTTP router
- `github.com/redis/go-redis/v9` - Redis client
- `github.com/google/uuid` - UUID generation
- `github.com/stretchr/testify` - Testing

### Configuration
- `MOCKGATEHUB_PORT` (default: 8080)
- `MOCKGATEHUB_REDIS_URL` (optional)
- `MOCKGATEHUB_REDIS_DB` (default: 0)
- `WEBHOOK_URL` - Wallet backend webhook endpoint
- `WEBHOOK_SECRET` - For signing webhooks

## Phase 2: Core Authentication & Storage

### 2.1 HMAC Signature Implementation
**File**: `internal/auth/signature.go`

```go
// Generate HMAC-SHA256 signature
// Format: HMAC-SHA256(timestamp + method + path + body, secret)
func GenerateSignature(timestamp, method, path, body, secret string) string

// Validate incoming request signature
func ValidateSignature(r *http.Request, secret string) bool
```

**Headers**:
- `x-gatehub-app-id`: Application ID
- `x-gatehub-timestamp`: Unix timestamp
- `x-gatehub-signature`: HMAC signature

### 2.2 Storage Interface
**File**: `internal/storage/interface.go`

```go
type Storage interface {
    // Users
    CreateUser(user *models.User) error
    GetUser(id string) (*models.User, error)
    GetUserByEmail(email string) (*models.User, error)
    UpdateUser(user *models.User) error
    
    // Wallets
    CreateWallet(wallet *models.Wallet) error
    GetWallet(address string) (*models.Wallet, error)
    GetWalletsByUser(userID string) ([]*models.Wallet, error)
    
    // Transactions
    CreateTransaction(tx *models.Transaction) error
    GetTransaction(id string) (*models.Transaction, error)
    
    // Balances (per user, per currency)
    GetBalance(userID, currency string) (float64, error)
    AddBalance(userID, currency string, amount float64) error
    DeductBalance(userID, currency string, amount float64) error
}
```

**Implementations**:
- `memory.go` - In-memory with sync.RWMutex (for tests)
- `redis.go` - Redis-backed (for runtime)
- `seeder.go` - Pre-seed test users

### 2.3 Data Models
**File**: `internal/models/models.go`

```go
type User struct {
    ID                string    `json:"id"`
    Email             string    `json:"email"`
    Activated         bool      `json:"activated"`
    Managed           bool      `json:"managed"`
    Role              string    `json:"role"`
    Features          []string  `json:"features"`
    KYCState          string    `json:"kyc_state"`     // accepted/rejected/action_required
    RiskLevel         string    `json:"risk_level"`    // low/medium/high
    CreatedAt         time.Time `json:"created_at"`
}

type Wallet struct {
    Address           string    `json:"address"`       // Mock XRPL address
    UserID            string    `json:"user_id"`
    Name              string    `json:"name"`
    Type              int       `json:"type"`
    Network           int       `json:"network"`       // 30 for XRP Ledger
    CreatedAt         time.Time `json:"created_at"`
}

type Transaction struct {
    ID                string    `json:"id"`
    UserID            string    `json:"user_id"`
    UID               string    `json:"uid"`           // External reference
    Amount            float64   `json:"amount"`
    Currency          string    `json:"currency"`
    VaultUUID         string    `json:"vault_uuid"`
    ReceivingAddress  string    `json:"receiving_address"`
    Type              int       `json:"type"`          // 1=deposit, 2=hosted
    DepositType       string    `json:"deposit_type"`  // external/hosted
    Status            string    `json:"status"`
    CreatedAt         time.Time `json:"created_at"`
}
```

## Phase 3: API Endpoints

### Authentication (`/auth/v1/`)
- `POST /tokens` - Generate access token (stub - return success)
- `POST /users/managed` - Create managed user
- `GET /users/managed` - Get managed user by email
- `PUT /users/managed/email` - Update email

### Identity/KYC (`/id/v1/`)
- `GET /users/{userID}` - Get user state
- `POST /users/{userID}/hubs/{gatewayID}` - Start KYC (return iframe URL)
- `PUT /hubs/{gatewayID}/users/{userID}` - Update KYC state
- `GET /iframe/onboarding` - KYC iframe HTML

### Wallets/Transactions (`/core/v1/`)
- `POST /wallets` - Create wallet (return mock XRPL address)
- `GET /wallets/{address}` - Get wallet details
- `GET /wallets/{address}/balance` - Multi-currency balance
- `POST /transactions` - Create deposit/transaction

### Rates (`/rates/v1/`)
- `GET /rates/current` - Hardcoded exchange rates
- `GET /liquidity_provider/vaults` - Vault UUIDs

### Cards (`/cards/v1/`) - Stubs
- `POST /customers/managed` - Return success
- `POST /cards` - Return success
- Other card endpoints stubbed

### Health
- `GET /health` - Health check

## Phase 4: Sandbox Configuration

### Supported Currencies (11 total)
```go
var SandboxCurrencies = []string{
    "XRP", "USD", "EUR", "GBP", "ZAR",
    "MXN", "SGD", "CAD", "EGG", "PEB", "PKR",
}
```

### Vault UUIDs
```go
var SandboxVaultIDs = map[string]string{
    "USD": "450d2156-132a-4d3f-88c5-74822547658d",
    "EUR": "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341",
    "GBP": "vault-gbp-uuid",
    "ZAR": "vault-zar-uuid",
    "MXN": "vault-mxn-uuid",
    "SGD": "vault-sgd-uuid",
    "CAD": "vault-cad-uuid",
    "EGG": "vault-egg-uuid",
    "PEB": "vault-peb-uuid",
    "PKR": "vault-pkr-uuid",
    "XRP": "vault-xrp-uuid",
}
```

### Exchange Rates (vs USD)
```go
var SandboxRates = map[string]float64{
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.27,
    "ZAR": 0.054,
    "MXN": 0.059,
    "SGD": 0.74,
    "CAD": 0.71,
    "PKR": 0.0036,
    "EGG": 1.0,   // Test currency
    "PEB": 1.0,   // Test currency
    "XRP": 0.50,
}
```

### Pre-seeded Test Users
```
testuser1@mockgatehub.local
- ID: 00000000-0000-0000-0000-000000000001
- Balance: 10,000 USD
- KYC: Verified

testuser2@mockgatehub.local
- ID: 00000000-0000-0000-0000-000000000002
- Balance: 10,000 EUR
- KYC: Verified
```

## Phase 5: KYC Flow

### KYC Iframe (`/web/kyc-form.html`)
Simple HTML form with:
- First name, Last name
- Date of birth
- Address fields
- Submit button

### Flow
1. Wallet → `POST /id/v1/users/{userID}/hubs/{gatewayID}`
2. MockGatehub → Returns iframe URL with token
3. User fills form in iframe
4. Form submits to MockGatehub
5. MockGatehub:
   - Updates KYC state to "accepted"
   - Sets risk level to "low"
   - Sends webhook `id.verification.accepted`
6. Wallet receives webhook → User approved

### Auto-approval Logic
Always approve KYC in sandbox mode:
- State: "accepted"
- Risk: "low"
- No rejection or action_required states (happy path only)

## Phase 6: Webhook System

### Webhook Manager
**File**: `internal/webhook/manager.go`

```go
type Manager struct {
    webhookURL    string
    webhookSecret string
    httpClient    *http.Client
}

func (m *Manager) SendAsync(event WebhookEvent)
```

### Event Types
- `id.verification.accepted` - After KYC approval
- `id.verification.action_required` - (optional)
- `id.verification.rejected` - (optional)
- `core.deposit.completed` - After EXTERNAL deposits
- Card events - (stubbed)

### Webhook Format
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

**Headers**:
- `x-gatehub-signature`: HMAC-SHA256 signature
- `content-type: application/json`

### Retry Logic
- 3 attempts
- Exponential backoff: 1s, 2s, 4s
- Log failures

## Phase 7: Multi-Currency Balance

### Balance Storage
Store per (userID, currency) pair in Redis:
```
balance:{userID}:{currency} → float64
```

### Balance Response
Return all 11 currencies (even if 0 balance):
```json
{
  "balances": [
    {"currency": "USD", "vault_uuid": "...", "balance": 10000.00},
    {"currency": "EUR", "vault_uuid": "...", "balance": 0.00},
    ...
  ]
}
```

### Transaction Updates
- **HOSTED** (type=2): Update balance immediately, no webhook
- **EXTERNAL** (type=1): Update balance + send webhook
- Validate sufficient balance before deductions

## Phase 8: Testing Strategy

### Unit Tests (80%+ coverage)
- `auth/signature_test.go` - HMAC generation/validation
- `storage/memory_test.go` - All CRUD operations
- `handler/*_test.go` - All endpoints (table-driven)
- `webhook/manager_test.go` - Delivery logic

### Test Data
Use testify assertions:
```go
func TestCreateUser(t *testing.T) {
    store := NewMemoryStorage()
    user := &models.User{...}
    err := store.CreateUser(user)
    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)
}
```

### Integration Test
Full workflow test:
1. Create user
2. Start KYC → Auto-approve
3. Create wallet
4. Deposit funds
5. Check balance (all currencies)
6. Verify webhook delivery

## Phase 9: Docker & Deployment

### Dockerfile
```dockerfile
FROM golang:1.24 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o mockgatehub ./cmd/mockgatehub

FROM alpine:latest
RUN apk --no-cache add ca-certificates curl
WORKDIR /root/
COPY --from=builder /app/mockgatehub .
COPY --from=builder /app/web ./web
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
CMD ["./mockgatehub"]
```

### docker-compose Integration
Already configured in `docker/local/docker-compose.yml`:
```yaml
mockgatehub:
  container_name: mockgatehub-local
  build:
    context: ../..
    dockerfile: ./packages/mockgatehub/Dockerfile
  ports:
    - '8080:8080'
  environment:
    MOCKGATEHUB_REDIS_URL: redis://redis-local:6379
    MOCKGATEHUB_REDIS_DB: '1'
    WEBHOOK_URL: http://wallet-backend:3003/gatehub-webhooks
    WEBHOOK_SECRET: ${GATEHUB_WEBHOOK_SECRET}
```

## Phase 10: Validation & Testing

### Local Stack Testing
```bash
cd docker/local
docker-compose up -d
```

**Test Checklist**:
- [ ] User registration works
- [ ] KYC iframe displays
- [ ] KYC auto-approves
- [ ] Wallet creation returns address
- [ ] Deposit increases balance
- [ ] Balance shows all 11 currencies
- [ ] Webhooks received by wallet-backend
- [ ] Exchange rates API works
- [ ] Vault UUIDs match expected values

### Monitoring
- Check logs: `docker-compose logs mockgatehub`
- Health check: `curl http://localhost:8080/health`
- Redis data: `redis-cli -n 1 KEYS "*"`

## Implementation Checklist

### Must Have (MVP)
- [ ] Go module setup
- [ ] Storage interface + memory implementation
- [ ] Storage Redis implementation
- [ ] User CRUD operations
- [ ] Wallet creation with mock addresses
- [ ] Transaction handling
- [ ] Multi-currency balance system
- [ ] KYC auto-approval
- [ ] Webhook delivery
- [ ] Exchange rates endpoint
- [ ] Vault UUIDs endpoint
- [ ] Unit tests (core functionality)
- [ ] Dockerfile
- [ ] README.md
- [ ] AGENTS.md

### Should Have
- [ ] HMAC signature validation
- [ ] KYC iframe HTML
- [ ] Complete test coverage (80%+)
- [ ] Integration tests
- [ ] Error handling & logging
- [ ] Health check endpoint

### Nice to Have
- [ ] Card endpoint stubs
- [ ] Advanced KYC states
- [ ] Transaction history
- [ ] Metrics/observability
- [ ] API documentation with examples

## Timeline Estimate

**Day 1-2**: Foundation + Storage + Models  
**Day 3-4**: API Endpoints + KYC Flow  
**Day 4-5**: Webhooks + Multi-currency  
**Day 5-6**: Testing + Documentation  
**Day 6-7**: Docker + Integration + Validation  

**Total: 6-7 days**

## Success Criteria

1. ✅ Wallet application runs locally without real Gatehub
2. ✅ Zero changes to `packages/wallet` code
3. ✅ KYC auto-approval works
4. ✅ Multi-currency deposits and balances work
5. ✅ Webhooks delivered successfully
6. ✅ 80%+ test coverage
7. ✅ Docker build succeeds
8. ✅ Full stack starts with docker-compose

---

**Status**: Implementation in progress  
**Last Updated**: January 20, 2026
