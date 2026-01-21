# Vault UUID Support for Deposits

## Overview

MockGatehub now supports the `vault_uuid` parameter for deposits, matching the real GateHub API behavior. This allows wallet-backend to specify which currency vault should receive a deposit by passing the vault UUID instead of (or in addition to) the currency code.

## How It Works

### 1. Vault UUID Mappings

Each currency has a unique, immutable vault UUID defined in `internal/consts/consts.go`:

```go
var SandboxVaultIDs = map[string]string{
    "USD": "450d2156-132a-4d3f-88c5-74822547658d",
    "EUR": "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341",
    "GBP": "8c3e4d5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
    // ... etc
}

var VaultUUIDToCurrency = map[string]string{
    "450d2156-132a-4d3f-88c5-74822547658d": "USD",
    "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341": "EUR",
    // ... etc (reverse mapping)
}
```

### 2. Deposit Iframe URL Parameters

The deposit iframe accepts the `vault_uuid` parameter to specify which currency vault should receive the deposit:

**URL Format:**
```
http://localhost:8080/iframe?paymentType=deposit&bearer=TOKEN&vault_uuid=450d2156-132a-4d3f-88c5-74822547658d
```

**Note:** The old `?currency=USD` parameter approach is **not supported** as wallet-frontend and wallet-backend do not use it.

### 3. Iframe Behavior

The iframe (`web/index.html`) includes vault UUID to currency mapping:
- Extracts `vault_uuid` from URL parameters
- Looks up corresponding currency using the mapping
- Pre-selects that currency in the dropdown
- Disables the dropdown (user cannot change it)
- Falls back to dynamic currency list if no vault_uuid provided

### 4. Webhook Payload

When a deposit is completed, the webhook sent to wallet-backend includes **both** `currency` and `vault_uuid`:

```json
{
  "event": "core.deposit.completed",
  "data": {
    "tx_uuid": "...",
    "amount": "100.00",
    "currency": "EUR",
    "vault_uuid": "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341",
    "address": "rUser123...",
    "deposit_type": "external",
    "total_fees": "0"
  }
}
```

**Implementation:** The webhook handler (`internal/handler/handler.go`) automatically looks up the vault_uuid from the currency using `consts.SandboxVaultIDs[currency]`.

## Benefits

### For Wallet-Backend Integration

1. **Currency Inference**: Wallet-backend can infer the currency from `vault_uuid` alone
2. **Validation**: Can validate that `currency` and `vault_uuid` match in webhook payload
3. **GateHub API Compatibility**: Matches the real GateHub API behavior using vault UUIDs

### Example Usage

**Scenario**: User wants to deposit EUR

**Wallet-backend generates iframe URL with vault_uuid:**
```javascript
const eurVaultUUID = "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341";
const iframeURL = `http://mockgatehub:8080/iframe?paymentType=deposit&bearer=${token}&vault_uuid=${eurVaultUUID}`;
```

**Result:**
1. Iframe loads with EUR pre-selected and locked
2. User enters amount and clicks "Complete"
3. Webhook sent to wallet-backend includes both `currency: "EUR"` and `vault_uuid: "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341"`
4. Wallet-backend can verify the currency matches the vault

## API Reference

### GET /iframe

**New Parameter:**
- Required Parameter:**
- `vault_uuid` (required for currency-specific deposits): UUID of the vault to deposit into
  - Currency will be inferred and pre-selected
  - Dropdown will be disabled (user cannot change currency)
  - Must be a valid vault UUID from `consts.SandboxVaultIDs`

**Note:** Without `vault_uuid`, the iframe will show all currencies the user has balances in (via `/api/user-currencies`).
**Example:**
```
GET /iframe?paymentType=deposit&bearer=TOKEN&vault_uuid=450d2156-132a-4d3f-88c5-74822547658d
```

### POST /transaction/complete

**Request Body (from iframe):**
```json
{
  "amount": "100.00",
  "currency": "EUR"
}
```

**Webhook Payload (sent to wallet-backend):**
```json
{
  "tx_uuid": "generated-uuid",
  "amount": "100.00",
  "currency": "EUR",
  "vault_uuid": "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341",  // ← Added automatically
  "address": "rUser123...",
  "deposit_type": "external",
  "total_fees": "0"
}
```

## Testing

**Test with vault_uuid parameter:**
```bash
# Open iframe with EUR vault
curl "http://localhost:8080/iframe?paymentType=deposit&bearer=YOUR_TOKEN&vault_uuid=a09a0a2c-1a3a-44c5-a1b9-603a6eea9341"
```

**Expected behavior:**
1. Iframe loads with "EUR" pre-selected
2. Currency dropdown is disabled (grayed out)
3. Debug info shows: "Vault UUID: a09a0a2c-1a3a-44c5-a1b9-603a6eea9341"
4. On completion, webhook includes both currency and vault_uuid

## Relationship to Other Featurcurrency filtering feature:
- **Without vault_uuid**: `/api/user-currencies` returns currencies user has balances in → dropdown shows filtered list
- **With vault_uuid**: Currency is inferred from vault → dropdown shows only that currency (locked)
- **New users (no balances)**: Dropdown shows all 11 supported currencies (unless vault_uuid is specifi
- **Vault-based locking**: `vault_uuid` parameter forces a specific currency
- **Combined behavior**: If vault_uuid specifies EUR, the dropdown will show only EUR (filtered + locked)

## References

- **GateHub API Documentation**: https://docs.gatehub.net/api-documentation/c3OPAp5dM191CDAdwyYS/api-reference/api-reference/transactions/deposit#get-deposit-address-for-wallet
- **Vault UUID Mappings**: `internal/consts/consts.go`
- **Iframe Implementation**: `web/index.html`
- **Webhook Handler**: `internal/handler/handler.go`
