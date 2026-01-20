# MockGatehub Test Environment

This directory contains an isolated test environment for running MockGatehub integration tests.

## Structure

```
testenv/
├── docker-compose.yml              # Isolated compose environment
├── testscript.go                   # Go-based integration tests (primary)
├── run-tests.sh                    # Test runner script
├── run-integration-tests.sh        # DEPRECATED - redirects to run-tests.sh
└── README.md                       # This file
```

## Quick Start

**Option 1: Direct execution (recommended)**
```bash
go run testscript.go
```

**Option 2: Using the wrapper script**
```bash
./run-tests.sh
```

The test script will:
1. Start MockGatehub and Redis in isolated containers (ports 28080, 26380)
2. Wait for services to be ready
3. Run all 12 integration tests
4. Print detailed results with color-coded output
5. Clean up containers and volumes automatically

## What Gets Tested

The integration test suite validates:
- ✅ Service health and availability
- ✅ User creation and management
- ✅ **Wallet auto-creation** (GET /core/v1/users/{userId} creates wallet if none exists)
- ✅ **Wallet persistence** (subsequent calls return same wallet)
- ✅ Authentication token generation
- ✅ KYC workflow (auto-approval in sandbox)
- ✅ Additional wallet creation via POST
- ✅ Multi-currency balance queries (11 currencies)
- ✅ Exchange rate data
- ✅ Vault information
- ✅ Transaction creation

## Configuration

The test environment uses:
- **Port 28080** for MockGatehub (avoiding conflicts with port 8080)
- **Port 26380** for Redis (avoiding conflicts with port 6379)
- **No Redis persistence** - data is cleared after each test run
- **Isolated network** - `mockgatehub-test` network

## Tests Included

The integration test suite covers all critical MockGatehub endpoints:

1. **Health check** - Service availability
2. **Create managed user** - User registration
3. **Get authorization token** - Authentication flow
4. **Start KYC** - Identity verification (auto-approved in sandbox)
5. **Get user KYC state** - Verification status check
6. **Create wallet** - XRPL wallet generation
7. **Get wallet balance** - Multi-currency balance retrieval (11 currencies)
8. **Get exchange rates** - Real-time rate data
9. **Get vault information** - Liquidity provider vault data
10. **Create transaction** - Transaction processing

All tests pass against the isolated test environment.

## Requirements

- **Go 1.24+** (for running tests)
- **Docker and Docker Compose** (for containers)
- **MockGatehub Docker image** built as `local-mockgatehub`

No additional tools needed - the Go script handles all HTTP requests and JSON parsing.

## Building the Docker Image

Before running tests, ensure the MockGatehub image is built:

```bash
cd /home/stephan/interledger/testnet
docker build -f packages/mockgatehub/Dockerfile -t local-mockgatehub .
```

## Troubleshooting

**Services fail to start:**
- Check if ports 28080 and 26380 are available: `lsof -i :28080 -i :26380`
- Ensure Docker daemon is running: `docker ps`
- Verify the `local-mockgatehub` image exists: `docker images | grep mockgatehub`
- Rebuild if needed: `cd ../../.. && docker build -f packages/mockgatehub/Dockerfile -t local-mockgatehub .`

**Tests fail:**
- Check service logs: `docker compose logs mockgatehub`
- Manually test endpoints: `curl http://localhost:28080/health`
- Ensure previous cleanup ran: `docker compose down -v`
- Check for port conflicts with main `docker/local` environment

**Go issues:**
- Ensure Go 1.24+: `go version`
- If `go run` fails, the script doesn't need a go.mod (it's a single-file program)
- On first run, Go will download standard library packages automatically

## Manual Usage

### Start Environment Only

```bash
# Start containers without running tests
docker compose up -d

# Check service health
curl http://localhost:28080/health

# View logs
docker compose logs -f mockgatehub

# Stop and clean up
docker compose down -v
```

### Modify Tests

Edit `testscript.go` to add new tests or modify existing ones. The code is structured with clear helper functions:

```go
runTest("Test Name", func() (bool, string) {
    // Your test logic here
    return success, message
})
```

### Run Specific Tests

The test script runs all tests sequentially. To debug a specific test:

1. Comment out other tests in the `runTests()` function
2. Run: `go run testscript.go`
3. Check detailed error messages in output
