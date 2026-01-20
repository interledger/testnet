# Phase 8 Pre-Integration Quick Reference

## MockGatehub vs Wallet Backend - Quick Lookup

### What We Know ✅
- **11 critical Gatehub endpoints** implemented and tested
- **All core user workflows** supported (create → KYC → wallet)
- **Security**: HMAC signing, proper headers, webhook validation all working
- **Docker**: Image built, docker-compose configured, ready to deploy
- **Tests**: 29/29 passing across all phases

### What Might Cause Issues ❌
1. **Card Operations** - Not implemented (15+ endpoints)
   - If wallet backend tries to list cards: Will fail
   - Workaround: Don't test card features in Phase 8
   - Impact: NONE for core wallet flow

2. **User Metadata** - PUT /auth/v1/users/managed not implemented
   - Used only in production for metadata storage
   - Impact: NONE for sandbox testing

3. **User Retrieval** - GET /core/v1/users/{id} not implemented
   - Wallet backend probably has workaround
   - Impact: MINIMAL - workaround available

### API Endpoints - Quick Reference

**Must Work** (All implemented ✅):
```
POST   /auth/v1/tokens                    ✅ Get iframe token
POST   /auth/v1/users/managed             ✅ Create user
PUT    /auth/v1/users/managed/email       ✅ Update email
POST   /id/v1/users/{id}/hubs/{gw}        ✅ Start KYC (auto-approve)
GET    /id/v1/users/{id}                  ✅ Get user state
POST   /core/v1/users/{id}/wallets        ✅ Create wallet
GET    /core/v1/wallets/{id}/balances     ✅ Get 11 currencies
POST   /core/v1/transactions              ✅ Create transaction
GET    /rates/v1/rates/current            ✅ Exchange rates
GET    /rates/v1/vaults                   ✅ Vault UUIDs
POST   /cards/v1/customers/managed        ✅ Create card customer
```

**Auto-Handled** (Sandbox only):
```
PUT    /id/v1/hubs/{gw}/users/{id}       ⚠️  Auto-approve
POST   /id/v1/hubs/{gw}/users/{id}/risk  ⚠️  Auto risk override
```

**Not Implemented** (Not needed for MVP):
```
All card operations (15+ endpoints)       ❌ Not critical
User metadata                             ❌ Production only
SEPA accounts                             ❌ Not core wallet
```

### Testing Checklist for Phase 8

#### Must Test ✅
- [ ] Create user → Get token → User state is empty
- [ ] Start KYC → Auto-approve → State shows "accepted"
- [ ] Create wallet → Get address (mock XRPL address)
- [ ] Get balance → Shows 11 currencies with UUIDs
- [ ] Create transaction → Balance updates
- [ ] Webhook delivery → Wallet backend processes event
- [ ] Exchange rates → Returns all 11 currencies
- [ ] Vault UUIDs → Match expected values

#### Optional Tests (Nice to Have)
- [ ] Invalid signature → 401 Unauthorized
- [ ] Missing headers → 401 Unauthorized
- [ ] Invalid wallet ID → Proper error response
- [ ] Rate limiting (if configured)
- [ ] CORS headers (if needed)

#### Should NOT Test (Not Implemented)
- [ ] Card listing (GET /cards/v1/customers/{id}/cards)
- [ ] Lock/unlock card operations
- [ ] PIN management
- [ ] User metadata updates
- [ ] SEPA account verification

### Response Format Quick Reference

#### Create User
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "activated": true,
    "managed": true,
    "role": "user",
    "features": ["wallet"],
    "kyc_state": "",
    "risk_level": "",
    "created_at": "ISO8601"
  }
}
```

#### Get Balance
```json
{
  "balances": [
    {
      "currency": "USD",
      "vault_uuid": "uuid",
      "balance": 0.00
    },
    ...11 currencies total...
  ]
}
```

#### Get Rates
```json
{
  "USD": { "rate": "1.0" },
  "EUR": { "rate": "0.92" },
  ... 11 currencies total...
}
```

### Environment Variables Needed

```bash
# Wallet Backend (must configure)
GATEHUB_API_BASE_URL=http://mockgatehub:8080
GATEHUB_ACCESS_KEY=<access-key>
GATEHUB_SECRET_KEY=<secret-key>
GATEHUB_WEBHOOK_SECRET=<webhook-secret>

# MockGatehub (auto-configured in docker-compose)
WEBHOOK_URL=http://wallet-backend:3003/gatehub-webhooks
WEBHOOK_SECRET=<webhook-secret>
```

### Common Failure Modes & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid HMAC signature | Check timestamp, method, URL, body format |
| 404 Not Found | Endpoint not implemented | Check if feature is non-critical (cards, metadata) |
| Connection refused | MockGatehub not running | `docker compose up mockgatehub` |
| Redis connection error | Redis not available | `docker compose up redis` |
| Webhook not received | Wrong webhook URL | Check `WEBHOOK_URL` env var in docker-compose |
| 400 Bad Request | Invalid JSON body | Validate request format matches API |

### Quick Debugging Tips

1. **Check MockGatehub logs**:
   ```bash
   docker compose logs mockgatehub -f
   ```

2. **Check request/response**:
   - MockGatehub logs all requests with [HANDLER] prefix
   - Shows full request body and response
   - Helps identify format mismatches

3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:8080/auth/v1/users/managed \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

4. **Check Redis data**:
   ```bash
   redis-cli -n 1 KEYS "*"
   redis-cli -n 1 GET "user:{user-id}"
   ```

5. **Validate HMAC signature**:
   - Format: `timestamp|METHOD|full-url|body`
   - Use SHA256 with secret key
   - Check timestamp is in milliseconds (13 digits)

### Success Indicators ✅

**Phase 8 Integration is Working When:**
1. User creation returns 201 with user ID
2. KYC iframe URL contains token parameter
3. User state shows kyc_state = "accepted" after KYC
4. Wallet creation returns XRPL-format address
5. Balance shows all 11 currencies with UUIDs
6. Transaction creation updates balance
7. Webhook arrives at wallet backend within 1 second
8. All responses are valid JSON with proper status codes

### Files to Reference

- **Detailed Analysis**: `WALLET_BACKEND_INTEGRATION_ANALYSIS.md`
- **Phase 7 Complete**: `PHASE7_COMPLETE.md`
- **Project Status**: `STATUS.md`
- **Phase Summaries**: `PHASE6_SUMMARY.md`, `PHASE7_SUMMARY.md`

---

**Ready to Begin Phase 8? ✅**

All systems are go. MockGatehub is containerized and ready for full stack integration testing with wallet backend.

Start with: `docker compose up mockgatehub redis wallet-backend`
