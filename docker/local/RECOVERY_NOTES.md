# Docker Compose Recovery Notes

## Recovery Date: January 20, 2026

The `docker-compose.yml` file was successfully recreated based on conversation history and existing configuration patterns.

### What Was Restored

✅ **docker-compose.yml** - Complete local development environment configuration

### Key Services Configured

1. **mockgatehub** (Port 8080)
   - Mock Gatehub API service
   - Webhook URL: `http://wallet-backend:3000/gatehub-webhooks`
   - Dockerfile: `packages/mockgatehub/Dockerfile`

2. **wallet-backend** (Port 3000)
   - Node.js backend service
   - Depends on: postgres, rafiki-backend, redis, mockgatehub
   - Debug port: 9229
   - Environment: Uses .env variables for Gatehub configuration

3. **wallet-frontend** (Port 3001)
   - Next.js frontend application
   - Depends on: wallet-backend

4. **Rafiki Services**
   - rafiki-auth (Ports 3006, 3008)
   - rafiki-backend (Ports 3010, 3011, 3005, 3002)
   - rafiki-frontend (Port 3012)
   - rafiki-card-service (Port 3007)
   - rafiki-pos-service (Port 3014)

5. **Supporting Services**
   - PostgreSQL (Port 5433)
   - Redis
   - TigerBeetle (ledger)
   - Kratos (identity, Port 4433)
   - Mailslurper (email, Ports 4436, 4437)

### Important Configuration

- **MockGatehub Integration**: Wallet backend connects to MockGatehub via `GATEHUB_API_BASE_URL` from .env
- **Webhook Configuration**: MockGatehub sends webhooks to `http://wallet-backend:3000/gatehub-webhooks`
- **Port Mapping**: 
  - localhost:3000 → wallet-backend:3000
  - localhost:3001 → wallet-frontend:3001
  - localhost:8080 → mockgatehub:8080
- **Database**: All services use postgres container at postgres:5432
- **Network**: All services on `testnet` bridge network with subnet 10.5.0.0/24

### .env File

The `.env` file at `docker/local/.env` contains:
- MockGatehub configuration (API URL, webhook secret, vault UUIDs)
- Wallet backend configuration (authentication keys, Gatehub credentials)
- Optional services (Stripe, card/email configuration)
- Development mode settings

### Starting Services

```bash
cd docker/local
docker-compose up -d
```

### Verifying Services

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs wallet-backend
docker-compose logs mockgatehub
```

### Key Ports for Testing

- Wallet Frontend: http://localhost:3001
- Wallet Backend: http://localhost:3000
- MockGatehub: http://localhost:8080
- Rafiki Frontend: http://localhost:3012
- Rafiki Admin: http://localhost:3011
- Kratos: http://localhost:4433

### Dependencies

- docker-compose >= 3.5
- All services share `testnet` network
- mockgatehub depends on wallet-backend for webhooks
- wallet-backend depends on rafiki-backend, postgres, redis, and mockgatehub

### Recovery Validation

✅ docker-compose.yml syntax validated
✅ All services defined
✅ All environment variables referenced from .env
✅ Port mappings configured
✅ Network and volumes configured
✅ MockGatehub webhook integration configured

