# MockGatehub - AI Agent Development Guide

This document provides comprehensive guidance for AI coding agents working on the MockGatehub project.

## Project Context

MockGatehub is a lightweight Golang mock implementation of the Gatehub API, designed specifically to support local development of the Interledger TestNet wallet application. It exists within the larger TestNet monorepo at `packages/mockgatehub/`.

### Why MockGatehub Exists

The TestNet wallet application integrates with Gatehub for:
- User identity and KYC verification
- Fiat currency custody (vaults)
- Multi-currency deposits and withdrawals
- Card services

MockGatehub removes the dependency on real Gatehub credentials and services, enabling:
- Fully local development without external dependencies
- Automated testing without API rate limits
- Predictable behavior for CI/CD pipelines
- Rapid iteration without affecting real Gatehub sandbox data

### Critical Constraints

1. **Zero Wallet Code Changes**: MockGatehub must be a drop-in replacement. The wallet backend expects exact Gatehub API compliance.
2. **Sandbox Parity Only**: Focus on happy paths and sandbox environment behavior. Production Gatehub features are out of scope.
3. **Multi-Currency Required**: Support all 11 currencies used in TestNet (XRP, USD, EUR, GBP, ZAR, MXN, SGD, CAD, EGG, PEB, PKR).
4. **Immutable Vault UUIDs**: Vault identifiers are hardcoded and must never change (wallet database stores these).

## Architecture Overview

### Tech Stack

- **Language**: Go 1.24+
- **HTTP Router**: chi v5 (lightweight, idiomatic)
- **Storage**: Dual backend (memory for tests, Redis for runtime)
- **Containerization**: Docker multi-stage build
- **Testing**: testify for assertions

### Directory Structure

```
packages/mockgatehub/
├── cmd/mockgatehub/           # Application entry point
│   └── main.go                # HTTP server setup, routing
├── internal/                  # Private application code
│   ├── auth/                  # HMAC signature generation/validation
│   │   ├── signature.go
│   │   └── signature_test.go
│   ├── models/                # Domain & API models
│   │   ├── models.go         # User, Wallet, Transaction
│   │   └── api.go            # Request/response DTOs
│   ├── storage/               # Storage layer
│   │   ├── interface.go      # Storage contract
│   │   ├── memory.go         # In-memory implementation
│   │   ├── memory_test.go
│   │   ├── redis.go          # Redis implementation
│   │   └── seeder.go         # Test user seeding
│   ├── handler/               # HTTP handlers
│   │   ├── handler.go        # Handler struct & dependencies
│   │   ├── auth.go           # /auth/v1 endpoints
│   │   ├── auth_test.go
│   │   ├── identity.go       # /id/v1 endpoints (KYC)
│   │   ├── identity_test.go
│   │   ├── core.go           # /core/v1 endpoints (wallets, txns)
│   │   ├── core_test.go
│   │   ├── rates.go          # /rates/v1 endpoints
│   │   ├── rates_test.go
│   │   ├── cards.go          # /cards/v1 endpoints (stubs)
│   │   └── health.go         # Health check
│   ├── webhook/               # Webhook delivery system
│   │   ├── manager.go        # Async webhook sender
│   │   ├── manager_test.go
│   │   └── models.go         # Webhook event models
│   ├── consts/                # Constants
│   │   └── consts.go         # Currencies, vault IDs, rates
│   ├── utils/                 # Utilities
│   │   ├── utils.go          # UUID, address generation
│   │   └── utils_test.go
│   └── logger/                # Logging
│       └── logger.go         # Simple logger setup
├── testenv/                   # Isolated integration test environment
│   ├── docker-compose.yml    # Test-only compose (ports 28080, 26380)
│   ├── testscript.go         # Go-based integration test suite
│   ├── .gitignore            # Ignore go.mod/go.sum
│   └── README.md             # Test environment documentation
├── web/                       # Static web assets
│   └── kyc-form.html         # KYC iframe HTML
├── Dockerfile                 # Multi-stage Docker build
├── go.mod                     # Go module definition
├── go.sum                     # Dependency checksums
├── README.md                  # User documentation
├── AGENTS.md                  # This file
└── PROJECT_PLAN.md            # Implementation roadmap

```

### Design Principles

1. **Dependency Injection**: Handler receives storage & webhook manager via constructor
2. **Interface-Based Storage**: Enables swapping memory/Redis without code changes
3. **Table-Driven Tests**: Use testify's suite pattern for comprehensive coverage
4. **Idiomatic Go**: Follow standard project layout, effective Go patterns
5. **Minimal Dependencies**: Only essential libraries (chi, redis, uuid, testify)

## Core Functionality

### 1. Storage Layer

**Interface** (`internal/storage/interface.go`):
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
    
    // Balances
    GetBalance(userID, currency string) (float64, error)
    AddBalance(userID, currency string, amount float64) error
    DeductBalance(userID, currency string, amount float64) error
}
```

**Memory Implementation**:
- Uses `sync.RWMutex` for thread safety
- Maps for users (by ID, by email), wallets (by address), transactions (by ID)
- Separate map for balances: `map[string]map[string]float64` (userID -> currency -> amount)

**Redis Implementation**:
- Keys: `user:{id}`, `user:email:{email}`, `wallet:{address}`, `tx:{id}`, `balance:{userID}:{currency}`
- JSON serialization for complex objects
- Atomic operations for balance updates (INCRBYFLOAT)

**Seeder**:
Pre-creates two test users with balances:
- `testuser1@mockgatehub.local`: 10,000 USD
- `testuser2@mockgatehub.local`: 10,000 EUR

### 2. Authentication (HMAC Signatures)

**Format**:
```
signature = HMAC-SHA256(timestamp + method + path + body, secret)
```

**Request Headers**:
- `x-gatehub-app-id`: Application identifier
- `x-gatehub-timestamp`: Unix timestamp (seconds)
- `x-gatehub-signature`: Hex-encoded HMAC signature

**Implementation Notes**:
- Generate: Used for outgoing webhooks
- Validate: Used for incoming requests (optional enforcement)
- Test with known inputs/outputs for deterministic verification

### 3. Multi-Currency System

**Supported Currencies**:
```go
XRP, USD, EUR, GBP, ZAR, MXN, SGD, CAD, EGG, PEB, PKR
```

**Vault UUIDs** (Immutable):
```go
USD: "450d2156-132a-4d3f-88c5-74822547658d"
EUR: "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341"
// ... (see consts/consts.go)
```

**Balance Behavior**:
- `GET /wallets/{address}/balance` must return ALL currencies
- Even if balance is 0.00, include the currency in response
- Format: `[{"currency": "USD", "vault_uuid": "...", "balance": 10000.00}, ...]`

**Exchange Rates**:
Hardcoded rates vs USD. Example:
```go
EUR: 1.08  // 1 EUR = 1.08 USD
GBP: 1.27  // 1 GBP = 1.27 USD
```

### 4. KYC (Know Your Customer) Flow

**Endpoints**:
1. `POST /id/v1/users/{userID}/hubs/{gatewayID}` - Initiate KYC
   - Returns iframe URL with token
2. `GET /iframe/onboarding?token=...` - Display KYC form
3. `POST /iframe/submit` - User submits KYC form
4. `PUT /hubs/{gatewayID}/users/{userID}` - Update KYC state (internal)

**Auto-Approval Logic**:
- Sandbox mode always approves KYC
- State: `"accepted"`
- Risk Level: `"low"`
- Send webhook: `id.verification.accepted`

**KYC Iframe** (`web/kyc-form.html`):
Simple HTML form with:
- Personal info (name, DOB)
- Address fields
- Submit → Auto-approve → Webhook

### 5. Wallet Operations

**Create Wallet**:
- `POST /core/v1/wallets`
- Input: `{user_id, name, type, network}`
- Generate mock XRPL address (format: `r` + 33 alphanumeric chars)
- Store wallet with address
- Return wallet object

**Get Balance**:
- `GET /wallets/{address}/balance`
- Lookup wallet → Get user_id
- Iterate all 11 currencies
- Return array of `{currency, vault_uuid, balance}`

### 6. Transaction Handling

**Types**:
1. **DEPOSIT (type=1)**: External deposit
   - `deposit_type: "external"`
   - Add balance immediately
   - Send webhook: `core.deposit.completed`

2. **HOSTED (type=2)**: Internal transfer
   - `deposit_type: "hosted"`
   - Add balance immediately
   - No webhook (internal operation)

**Implementation**:
```go
func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
    // Parse request
    // Validate currency, amount
    // Create transaction record
    // Update balance
    // If type=1 (external), send webhook asynchronously
    // Return transaction object
}
```

### 7. Webhook System

**Manager** (`internal/webhook/manager.go`):
```go
type Manager struct {
    webhookURL    string
    webhookSecret string
    httpClient    *http.Client
}

func (m *Manager) SendAsync(event WebhookEvent) {
    go m.sendWithRetry(event)
}
```

**Event Types**:
- `id.verification.accepted`
- `core.deposit.completed`

**Event Format**:
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

**Delivery**:
- Async (goroutine)
- 3 retry attempts
- Exponential backoff: 1s, 2s, 4s
- Sign with HMAC (x-gatehub-signature header)

## Testing Strategy

### Coverage Goal: 80%+

### Unit Tests

**Storage Tests** (`internal/storage/memory_test.go`):
```go
func TestMemoryStorage_CreateUser(t *testing.T) {
    store := NewMemoryStorage()
    user := &models.User{Email: "test@example.com"}
    err := store.CreateUser(user)
    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)
}
```

**Handler Tests** (`internal/handler/*_test.go`):
- Use `httptest.NewRecorder()` for response capture
- Table-driven tests for multiple scenarios
- Test both success and error cases

Example:
```go
func TestCreateWallet(t *testing.T) {
    tests := []struct {
        name       string
        body       string
        wantStatus int
        wantErr    bool
    }{
        {"valid wallet", `{"user_id":"123","name":"My Wallet"}`, 201, false},
        {"missing user_id", `{"name":"My Wallet"}`, 400, true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test logic
        })
    }
}
```

**Webhook Tests** (`internal/webhook/manager_test.go`):
- Use `httptest.NewServer()` to mock webhook receiver
- Verify signature generation
- Test retry logic with failing server

### Integration Test

Full workflow test (`internal/handler/integration_test.go`):
1. Create user → Verify storage
2. Start KYC → Auto-approve → Verify webhook
3. Create wallet → Verify address format
4. Create deposit → Verify balance update
5. Get balance → Verify all 11 currencies present

## Common Patterns

### Error Handling

```go
func (h *Handler) CreateWallet(w http.ResponseWriter, r *http.Request) {
    var req CreateWalletRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.sendError(w, http.StatusBadRequest, "Invalid request body")
        return
    }
    
    // Validation
    if req.UserID == "" {
        h.sendError(w, http.StatusBadRequest, "user_id is required")
        return
    }
    
    // Business logic
    wallet, err := h.createWallet(&req)
    if err != nil {
        logger.Error.Printf("Failed to create wallet: %v", err)
        h.sendError(w, http.StatusInternalServerError, "Internal server error")
        return
    }
    
    h.sendJSON(w, http.StatusCreated, wallet)
}
```

### JSON Response Helpers

```go
func (h *Handler) sendJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func (h *Handler) sendError(w http.ResponseWriter, status int, message string) {
    h.sendJSON(w, status, map[string]string{"error": message})
}
```

### Async Operations

```go
// Launch webhook delivery in background
go func() {
    if err := h.webhookManager.Send(event); err != nil {
        logger.Error.Printf("Webhook delivery failed: %v", err)
    }
}()
```

## Configuration

**Environment Variables**:
```bash
MOCKGATEHUB_PORT=8080                          # HTTP port
MOCKGATEHUB_REDIS_URL=redis://localhost:6379  # Redis connection
MOCKGATEHUB_REDIS_DB=1                         # Redis database number
WEBHOOK_URL=http://wallet-backend:3003/gatehub-webhooks
WEBHOOK_SECRET=your-secret-here
```

**Docker Compose Integration**:
Already configured in `docker/local/docker-compose.yml`:
- Service name: `mockgatehub`
- Container name: `mockgatehub-local`
- Port mapping: `8080:8080`
- Network: `testnet` bridge
- Depends on: `redis-local`

## Development Workflow

### 1. Making Changes

```bash
cd packages/mockgatehub
go mod tidy                    # Update dependencies
go test ./...                  # Run unit tests
cd testenv && go run testscript.go  # Run integration tests
cd .. && go build ./cmd/mockgatehub  # Build binary
```

### 2. Running Locally

```bash
# In-memory mode (for quick testing)
./mockgatehub

# With Redis (production-like)
MOCKGATEHUB_REDIS_URL=redis://localhost:6379 \
MOCKGATEHUB_REDIS_DB=1 \
./mockgatehub
```

### 3. Docker Build & Test

```bash
# Build fresh image
cd /path/to/testnet
docker build -f packages/mockgatehub/Dockerfile -t local-mockgatehub .

# Test in isolated environment
cd packages/mockgatehub/testenv
go run testscript.go

# Deploy to main development stack
cd ../../../docker/local
docker-compose up -d mockgatehub
docker-compose logs -f mockgatehub
```

### 4. Full Integration Testing

```bash
# Option 1: Isolated test environment (recommended for development)
cd packages/mockgatehub/testenv
go run testscript.go

# Option 2: With full wallet stack
cd docker/local
docker-compose up -d  # Starts wallet, rafiki, mockgatehub, etc.
# Test via wallet UI or API
```

## Troubleshooting

### "no Go files in ..."
- Ensure all `.go` files have `package` declaration
- Check directory structure matches expected layout

### "undefined: Storage"
- Import paths must use full module name: `github.com/interledger/testnet/packages/mockgatehub/internal/storage`
- Run `go mod tidy` to resolve dependencies

### Tests failing with Redis
- Ensure Redis is running: `redis-cli ping`
- Check Redis DB is empty: `redis-cli -n 1 FLUSHDB`
- Use in-memory storage for unit tests

### Docker build fails
- Check Dockerfile paths match actual structure
- Ensure `go.mod` and `go.sum` are present
- Verify no syntax errors: `go build ./...`

### Webhooks not arriving
- Check `WEBHOOK_URL` environment variable
- Verify wallet-backend is running and accessible
- Check logs: `docker-compose logs mockgatehub webhook-manager`

## AI Agent Best Practices

### When Adding New Endpoints

1. **Define Models**: Add request/response DTOs to `internal/models/api.go`
2. **Implement Handler**: Add method to `internal/handler/{domain}.go`
3. **Add Route**: Register in `cmd/mockgatehub/main.go` setupRoutes
4. **Write Tests**: Create table-driven test in `{domain}_test.go`
5. **Update Docs**: Add endpoint to README.md API section

### When Modifying Storage

1. **Update Interface**: Change `internal/storage/interface.go`
2. **Update Both Implementations**: memory.go AND redis.go
3. **Add Tests**: Cover new functionality in both `memory_test.go` and integration tests
4. **Check Seeder**: Update if affecting test user creation

### When Changing Constants

1. **Update consts.go**: Modify `internal/consts/consts.go`
2. **Verify Immutables**: Never change existing vault UUIDs
3. **Update Tests**: Search for hardcoded values in test files
4. **Update Docs**: Reflect changes in README.md tables

### Testing Checklist

- [ ] Unit tests pass: `go test ./...`
- [ ] Coverage acceptable: `go test -cover ./...` (aim for 80%+)
- [ ] Integration test passes: `cd testenv && go run testscript.go`
- [ ] Docker build succeeds
- [ ] Full stack starts: `docker-compose up` (in `docker/local`)
- [ ] Wallet application works with MockGatehub
- [ ] Test environment isolated: No port conflicts with main environment

### Critical: Maintain testenv/

**The `testenv/` directory is NOT optional**. Future agents MUST maintain it when making changes:

1. **When adding new endpoints**: Update `testscript.go` with corresponding test cases
2. **When changing API responses**: Verify tests still pass - update assertions if needed
3. **When modifying authentication**: Ensure test headers are still valid
4. **When adding new features**: Add comprehensive test coverage in testscript.go

**testenv/ provides**:
- Isolated integration testing (no conflicts with `docker/local`)
- Fast feedback loop for full-stack changes
- Regression prevention for critical user journeys
- CI/CD validation readiness

**Running tests**:
```bash
cd testenv
go run testscript.go  # Starts containers, runs all tests, cleans up
```

**Expected outcome**: All 10 tests pass (Health → User → Auth → KYC → Wallet → Balance → Rates → Vaults → Transaction)

**If tests fail after your changes**:
1. Check what changed in API responses
2. Update test assertions in testscript.go
3. Ensure backward compatibility (wallet code depends on exact response format)
4. If breaking change is necessary, document it and coordinate with wallet team

## Key Files Reference

**Must Review Before Coding**:
1. `internal/consts/consts.go` - All constants (currencies, vault IDs, rates)
2. `internal/storage/interface.go` - Storage contract
3. `internal/models/models.go` - Domain models
4. `cmd/mockgatehub/main.go` - Routing configuration

**Frequently Modified**:
1. `internal/handler/*.go` - API endpoint implementations
2. `internal/storage/memory.go` - In-memory storage logic
3. `internal/webhook/manager.go` - Webhook delivery

**Rarely Touch**:
1. `internal/logger/logger.go` - Basic logging setup
2. `internal/utils/utils.go` - Utility functions
3. `Dockerfile` - Container build configuration

## Success Metrics

Your changes should maintain or improve:
- **Test Coverage**: ≥80%
- **API Compliance**: Wallet code runs without modification
- **Docker Build Time**: Keep under 2 minutes
- **Response Time**: All endpoints < 100ms (local)
- **Memory Usage**: < 100MB for in-memory mode

## Questions? Issues?

When encountering ambiguity:
1. Check existing implementation in similar endpoints
2. Refer to Gatehub sandbox API documentation (if accessible)
3. Test against wallet application behavior
4. Default to simplest solution that maintains wallet compatibility

Remember: MockGatehub is a development tool. Prioritize simplicity, testability, and wallet compatibility over feature completeness.

---

**Last Updated**: January 20, 2026  
**Maintainers**: Interledger Foundation  
**Repository**: https://github.com/interledger/testnet
