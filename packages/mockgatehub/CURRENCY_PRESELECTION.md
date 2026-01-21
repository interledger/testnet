# Currency Pre-selection for Deposit Iframe

## Problem
When users click "Deposit USD" or "Deposit EUR" in the wallet UI, they are shown an iframe with **all available currencies** to choose from. This is confusing because we already know which currency they want to deposit.

## Solution (MockGatehub-Only, No Frontend/Backend Changes Required!)

The deposit iframe now **dynamically fetches and displays only the currencies the user has accounts/balances for**.

### How It Works

1. **Iframe loads** with bearer token
2. **JavaScript calls** `/api/user-currencies?bearer=token`
3. **MockGatehub returns** currencies with non-zero balances
4. **Dropdown populates** with only user's currencies
5. **Auto-selects** if user has only 1 currency account

### Implementation Details (✅ All in MockGatehub)

**New API Endpoint:**
```
GET /api/user-currencies?bearer=<token>

Response:
{
  "currencies": ["USD", "EUR"]
}
```

**Logic:**
- Extracts user UUID from bearer token
- Checks balance for each currency (USD, EUR, CAD, etc.)
- Returns only currencies with balance > 0
- Falls back to all currencies if user has no deposits yet

**Smart Behavior:**
- **Single currency:** Pre-selected and disabled (e.g., user only has EUR account)
- **Multiple currencies:** Shows dropdown with user's currencies only
- **New user (no deposits):** Shows all currencies (first-time deposit)
- **Vault UUID parameter:** When `?vault_uuid=...` is provided, currency is inferred and locked (see VAULT_UUID_SUPPORT.md)

### User Experience Examples

**Example 1: User with only USD account**
- User clicks any deposit button
- Iframe shows: `Currency: USD ▼` (disabled, greyed out)
- User only needs to enter amount

**Example 2: User with USD and EUR accounts**
- User clicks deposit button
- Iframe shows dropdown: `USD, EUR` (only these 2)
- User selects which one to deposit to

**Example 3: Brand new user (no deposits yet)**
- User opens deposit iframe
- Iframe shows all 12 currencies (normal behavior)
- After first deposit, subsequent deposits show only their currency

### Testing

**Start MockGatehub:**
```bash
cd packages/mockgatehub
./mockgatehub
```

**Test scenarios:**

1. **New user (no deposits):**
```bash
# Should show all 12 currencies
curl "http://localhost:3001/api/user-currencies?bearer=test-token"
```

2. **User with existing deposits:**
```bash
# Create user, deposit USD, then check currencies
# Should return only: {"currencies": ["USD"]}
```

3. **URL override still works:**
```
http://localhost:3001/?paymentType=deposit&bearer=token&currency=EUR
# Currency=EUR will be pre-selected if user has EUR account
```

### Benefits

✅ **Zero frontend/backend changes** - Only MockGatehub modified  
✅ **Smarter UX** - Shows only relevant currencies  
✅ **Single-currency users** - Auto-selected, no dropdown needed  
✅ **Multi-currency users** - Reduced options, less confusion  
✅ **New users** - Still see all currencies for first deposit  
✅ **Backward compatible** - URL parameter still works  
✅ **Production-safe** - No changes to production code  

### Technical Implementation

**Files Modified:**
1. `/cmd/mockgatehub/main.go` - Added route `/api/user-currencies`
2. `/internal/handler/core.go` - Added `GetUserCurrencies()` handler
3. `/web/index.html` - Added `fetchUserCurrencies()` and dynamic dropdown

**No changes needed in:**
- ❌ wallet-backend (production code)
- ❌ wallet-frontend (production code)
- ✅ Only MockGatehub (test/dev tool)  

