# Wallet Backend - Gatehub API Analysis

## Executive Summary

The wallet backend makes extensive use of the Gatehub API across multiple areas:
- **User Management**: Creating users, getting user state, updating emails
- **Identity/KYC**: Connecting users to gateways, auto-approval in sandbox
- **Wallets & Transactions**: Creating wallets, retrieving balances, creating transactions
- **Cards**: Creating customers, managing cards, handling card transactions
- **Rates & Vaults**: Retrieving exchange rates and vault information
- **Webhooks**: Receiving and processing webhook events

## API Calls Inventory

### 1. Authentication & User Management

#### POST /auth/v1/tokens
**Used in**: `getIframeAuthorizationToken()`
**Purpose**: Get bearer token for iframe authorization
**Parameters**: 
- `clientId`: Varies by iframe type (onboarding, onOffRamp, exchange)
- `scope`: Array of scopes

**MockGatehub Status**: ✅ IMPLEMENTED (`CreateToken`)

---

#### POST /auth/v1/users/managed
**Used in**: `createManagedUser()`
**Purpose**: Create a new managed user in Gatehub
**Parameters**: `{ email: string }`
**Response**: User object with ID, email, activated status

**MockGatehub Status**: ✅ IMPLEMENTED (`CreateManagedUser`)

---

#### PUT /auth/v1/users/managed/email
**Used in**: `updateEmailForManagedUser()`
**Purpose**: Update email for managed user
**Parameters**: `{ email: string }`

**MockGatehub Status**: ✅ IMPLEMENTED (`UpdateManagedUserEmail`)

---

#### GET /auth/v1/users/organization/{orgId}
**Used in**: `getManagedUsers()`
**Purpose**: Get all managed users for organization
**Returns**: Array of user objects

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Low - Not used in critical user flow

---

#### PUT /auth/v1/users/managed
**Used in**: `updateMetaForManagedUser()`
**Purpose**: Store metadata for user (nested as meta.meta)
**Parameters**: `{ meta: Record<string, string> }`

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used to store user information in production

---

### 2. Identity/KYC

#### POST /id/v1/users/{userId}/hubs/{gatewayId}
**Used in**: `connectUserToGateway()`
**Purpose**: Connect user to gateway, initiate KYC
**Sandbox Behavior**: Auto-approves and overrides risk level
**Response**: `{ token: string, iframe_url: string }`

**MockGatehub Status**: ✅ IMPLEMENTED (`StartKYC`)
**Note**: Our implementation returns auto-approved state correctly

---

#### GET /id/v1/users/{userId}
**Used in**: `getUserState()`
**Purpose**: Get current user KYC state
**Returns**: `{ verifications: [{ status: number, ... }], kyc_state, risk_level }`

**MockGatehub Status**: ✅ IMPLEMENTED (`GetUser`)

---

#### PUT /id/v1/hubs/{gatewayId}/users/{userId}
**Used in**: `approveUserToGateway()` (private)
**Purpose**: Manually approve user to gateway
**Parameters**: `{ verified: 1, reasons: [], customMessage: boolean }`

**MockGatehub Status**: ❌ NOT IMPLEMENTED (Private method)
**Impact**: Low - Used internally by ConnectUserToGateway in sandbox

---

#### POST /id/v1/hubs/{gatewayId}/users/{userId}/overrideRiskLevel
**Used in**: `overrideRiskLevel()` (private)
**Purpose**: Override user risk level
**Parameters**: `{ risk_level: string, reason: string }`

**MockGatehub Status**: ❌ NOT IMPLEMENTED (Private method)
**Impact**: Low - Used internally by ConnectUserToGateway in sandbox

---

### 3. Wallets & Core

#### POST /core/v1/users/{userId}/wallets
**Used in**: `createWallet()`
**Purpose**: Create hosted wallet for user
**Parameters**: `{ name: string, type: number }`
**Response**: `{ address: string, user_id, name, type, network }`

**MockGatehub Status**: ✅ IMPLEMENTED (`CreateWallet`)

---

#### GET /core/v1/users/{userId}/wallets/{walletId}
**Used in**: `getWallet()`
**Purpose**: Get wallet details
**Response**: Wallet object with address, balance info

**MockGatehub Status**: ❌ NOT IMPLEMENTED (Specific wallet retrieval)
**Impact**: Low - Not used in main flows

---

#### GET /core/v1/users/{userId}
**Used in**: `getWalletForUser()`
**Purpose**: Get user with all their wallets
**Response**: `{ id, email, wallets: [...] }`

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used to get all user wallets

---

#### GET /core/v1/wallets/{walletId}/balances
**Used in**: `getWalletBalance()`
**Purpose**: Get balance for all currencies in wallet
**Response**: Array of `{ currency, vault_uuid, balance }`

**MockGatehub Status**: ✅ IMPLEMENTED (`GetWalletBalance`)
**Note**: Returns 11 currencies with vault UUIDs

---

#### POST /core/v1/transactions
**Used in**: `createTransaction()`
**Purpose**: Create transaction (deposit/withdrawal/hosted)
**Parameters**: Transaction details with vault_uuid, amount, currency
**Response**: Transaction object with ID and status

**MockGatehub Status**: ✅ IMPLEMENTED (`CreateTransaction`)
**Used for**:
- External deposits from Rafiki
- Settlements from outgoing payments
- Internal transaction tracking

---

#### GET /core/v1/users/{userId} (Implied)
**Used in**: Not directly, but structure assumed

**MockGatehub Status**: ⚠️ PARTIALLY (via GetUser)

---

### 4. Rates & Liquidity

#### GET /rates/v1/rates/current
**Used in**: `getRates()`
**Purpose**: Get exchange rates for base currency
**Query**: `?counter={base}&amount=1&useAll=true`
**Response**: Object mapping currencies to rate objects

**MockGatehub Status**: ✅ IMPLEMENTED (`GetCurrentRates`)

---

#### GET /rates/v1/liquidity_provider/vaults
**Used in**: `getVaults()`
**Purpose**: Get vault information for all currencies
**Response**: Array of vault objects with UUIDs

**MockGatehub Status**: ✅ IMPLEMENTED (`GetVaults`)

---

### 5. Cards

#### POST /cards/v1/customers/managed
**Used in**: `createCustomer()`
**Purpose**: Create managed card customer
**Headers**: Includes `x-gatehub-card-app-id`
**Parameters**: Customer details

**MockGatehub Status**: ✅ IMPLEMENTED (`CreateManagedCustomer`)

---

#### GET /cards/v1/customers/{customerId}/cards
**Used in**: `getCardsByCustomer()`
**Purpose**: Get all cards for customer

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used to retrieve user's cards

---

#### POST /cards/v1/cards/{cardId}/plastic
**Used in**: `orderPlasticForCard()` (deprecated)
**Purpose**: Order physical card

**MockGatehub Status**: ❌ NOT IMPLEMENTED (Deprecated)

---

#### POST /cards/v1/token/card-data
**Used in**: `getCardDetails()`
**Purpose**: Get token for card data retrieval
**Response**: `{ token: string }`

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used to get card details

---

#### GET /cards/v1/cards/{cardId}/transactions
**Used in**: `getCardTransactions()`
**Purpose**: Get card transaction history
**Query**: Supports pagination

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used for transaction history

---

#### PUT /cards/v1/cards/{cardId}/lock
**Used in**: `lockCard()`
**Purpose**: Lock a card
**Query**: `?reasonCode={code}`

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used for card management

---

#### PUT /cards/v1/cards/{cardId}/unlock
**Used in**: `unlockCard()`
**Purpose**: Unlock a card

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used for card management

---

#### PUT /v1/cards/{cardId}/block
**Used in**: `permanentlyBlockCard()`
**Purpose**: Permanently block a card

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Low - Used for card blocking

---

#### DELETE /cards/v1/cards/{cardId}/card
**Used in**: `closeCard()`
**Purpose**: Close/delete card
**Query**: `?reasonCode={reason}`

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Low - Used when closing cards

---

#### POST /cards/v1/cards/{accountId}/card
**Used in**: `createCard()` (deprecated)
**Purpose**: Create card

**MockGatehub Status**: ❌ NOT IMPLEMENTED (Deprecated)

---

#### POST /cards/v1/token/pin
**Used in**: `getPin()`
**Purpose**: Get token for PIN retrieval

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used for card PIN access

---

#### POST /cards/v1/token/pin-change
**Used in**: `getTokenForPinChange()`
**Purpose**: Get token for PIN change

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Medium - Used for PIN management

---

#### GET /v1/cards/{cardId}/limits
**Used in**: `getCardLimits()`
**Purpose**: Get card spending limits

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Low - Used for card limit info

---

#### POST /v1/cards/{cardId}/limits
**Used in**: `createOrOverrideCardLimits()`
**Purpose**: Set card spending limits

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Low - Used for limit management

---

### 6. Other

#### POST /core/v1/users/{orgId}/accounts
**Used in**: `getSEPADetails()`
**Purpose**: Get SEPA account details for IBAN
**Custom Auth**: Optional alternate keys

**MockGatehub Status**: ❌ NOT IMPLEMENTED
**Impact**: Low - SEPA-specific, not core wallet flow

---

## HTTP Methods & Headers

### Standard Request Headers
All Gatehub API calls use these headers:
```
Content-Type: application/json
x-gatehub-app-id: {accessKey}
x-gatehub-timestamp: {milliseconds}
x-gatehub-signature: {HMAC-SHA256 signature}
```

### Optional Headers
```
x-gatehub-managed-user-uuid: {userUuid}      (for user-specific calls)
x-gatehub-card-app-id: {cardAppId}           (for card operations)
Authorization: Bearer {token}                 (for iframe tokens)
```

### Signature Format
```
toSign = timestamp | method | url [| body]
signature = HMAC-SHA256(toSign, secretKey).hex()
```

**MockGatehub Status**: ✅ IMPLEMENTED (Validated in middleware)

---

## Critical Integration Points

### 1. User Lifecycle
```
Wallet Backend              MockGatehub
    |                           |
    +--[POST /auth/v1/users/managed]-->+
    |                           | Create user
    |<--[User with ID]----------+
    |                           |
    +--[POST /id/v1/users/{id}/hubs/{gw}]-->+
    |                           | Auto-approve
    |<--[Iframe URL]------------+
    |                           |
```
**Status**: ✅ IMPLEMENTED

### 2. Transaction Flow
```
Wallet Backend              MockGatehub
    |                           |
    +--[POST /core/v1/transactions]-->+
    |                           | Process
    |<--[Transaction ID]-------+
    |                           |
    +--[GET /core/v1/wallets/{id}/balances]-->+
    |                           | Retrieve
    |<--[Balances]-------------+
```
**Status**: ✅ IMPLEMENTED

### 3. Webhook Processing
```
MockGatehub                 Wallet Backend
    |                           |
    +--[POST /gatehub-webhooks]-->+
    |                           | Process event
    |<--[200 OK]---------------+
```
**Status**: ✅ IMPLEMENTED

---

## Implementation Gaps & Missing Features

### High Priority (Core Functionality)
1. **PUT /auth/v1/users/managed** - Update user metadata
   - Currently stored as `meta.meta` in database
   - Not critical for MVP but needed for production

2. **GET /core/v1/users/{userId}** - Get user with all wallets
   - Used in wallet initialization
   - Can work around with existing endpoints

### Medium Priority (Card Features)
1. **Card Retrieval**: GET /cards/v1/customers/{id}/cards
2. **Card Lock/Unlock**: PUT endpoints for card state
3. **Card Transactions**: GET /cards/v1/cards/{id}/transactions
4. **PIN Management**: Token endpoints for PIN operations
5. **Card Limits**: GET/POST for spending limits

### Low Priority (Deprecated/SEPA)
1. **POST /cards/v1/cards/{accountId}/card** (deprecated)
2. **POST /core/v1/users/{orgId}/accounts** (SEPA-specific)
3. **GET /v1/card-applications/{id}/card-products** (deprecated)

---

## Wallet Backend to MockGatehub Compatibility Matrix

| Category | Feature | Wallet Needs | MockGatehub Status | Critical? |
|----------|---------|--------------|-------------------|-----------|
| Auth | Create User | ✅ | ✅ | YES |
| Auth | Get Token | ✅ | ✅ | YES |
| Auth | Update Email | ✅ | ✅ | YES |
| Auth | Update Meta | ✅ | ❌ | NO |
| Auth | List Users | ✅ | ❌ | NO |
| KYC | Start KYC | ✅ | ✅ | YES |
| KYC | Get User State | ✅ | ✅ | YES |
| KYC | Approve User | ✅ | ❌ | NO* |
| Wallets | Create Wallet | ✅ | ✅ | YES |
| Wallets | Get Wallet | ✅ | ❌ | NO** |
| Wallets | Get User Wallets | ✅ | ❌ | NO** |
| Wallets | Get Balance | ✅ | ✅ | YES |
| Transactions | Create Transaction | ✅ | ✅ | YES |
| Rates | Get Rates | ✅ | ✅ | YES |
| Rates | Get Vaults | ✅ | ✅ | YES |
| Cards | Create Customer | ✅ | ✅ | YES |
| Cards | Get Cards | ✅ | ❌ | NO** |
| Cards | Lock/Unlock | ✅ | ❌ | NO |
| Cards | Transactions | ✅ | ❌ | NO |
| Cards | PIN | ✅ | ❌ | NO |

*: Auto-approved in sandbox, only needs manual approval in production
**: Can work around with existing endpoints in sandbox

---

## Recommendations for Phase 8

### Must Implement (For Full Integration)
1. ✅ All currently implemented endpoints work correctly
2. ⚠️ Test sandbox flow without approve/override endpoints (auto-handled)
3. ⚠️ Verify transaction creation with proper wallet IDs

### Should Implement (For Completeness)
1. `PUT /auth/v1/users/managed` - User metadata updates
2. `GET /core/v1/users/{userId}` - Get user with wallets
3. `GET /cards/v1/customers/{id}/cards` - List customer cards

### Can Defer (Not Needed for Core Wallet)
1. Card lock/unlock endpoints
2. PIN management endpoints
3. Card transaction history
4. SEPA account details
5. Deprecated card creation

---

## Testing Strategy for Phase 8

### Test Scenarios
1. **User Creation & Authentication**
   - Create user → Get token → Verify state ✅

2. **KYC Flow**
   - Connect to gateway → Auto-approve → Get iframe URL ✅

3. **Wallet & Balance**
   - Create wallet → Get balance → Verify 11 currencies ✅

4. **Transaction Processing**
   - Create transaction → Check balance update ✅

5. **Rate Lookup**
   - Get current rates → Get vault UUIDs ✅

6. **Webhook Delivery**
   - Send webhook → Verify processing ✅

### Mock Data Requirements
- Test user with valid email
- Test wallet addresses
- Test transaction IDs
- Test webhook events (KYC, deposit, card)

---

## Security Considerations

### HMAC Signature Validation
✅ **Implemented** in wallet backend
- Signature format: `timestamp|method|url[|body]`
- Uses SHA256 with secret key
- MockGatehub validates signatures

### Headers Security
✅ **Implemented**
- `x-gatehub-app-id`: Access key sent
- `x-gatehub-timestamp`: Millisecond precision
- `x-gatehub-managed-user-uuid`: User isolation
- `x-gatehub-card-app-id`: Card app isolation

### Webhook Signature Validation
✅ **Implemented** in wallet backend middleware
- Validates HMAC signature on webhook requests
- Uses `GATEHUB_WEBHOOK_SECRET` 
- Returns 200 only after validation

---

## Conclusion

The wallet backend's Gatehub integration is **primarily compatible** with MockGatehub:

### ✅ Working
- User management (create, get state, tokens)
- KYC flow with auto-approval
- Wallet creation and balance retrieval
- Transaction creation
- Exchange rates and vault information
- Webhook delivery and processing

### ⚠️ Partially Working
- Private methods (approve user) handled by auto-approval
- Some retrieval endpoints missing but have workarounds

### ❌ Not Implemented (Non-Critical)
- User metadata updates
- Card retrieval and management
- PIN management
- SEPA details

**For Phase 8 Full Stack Integration**: All critical endpoints are functional. Can proceed with integration testing using docker-compose.

