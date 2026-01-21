package consts

// Supported currencies in sandbox environment
var SandboxCurrencies = []string{
	"XRP", "USD", "EUR", "GBP", "ZAR",
	"MXN", "SGD", "CAD", "EGG", "PEB", "PKR",
}

// Vault UUIDs for each currency (immutable)
// These must match the wallet-backend's SANDBOX_VAULT_IDS in packages/wallet/backend/src/gatehub/consts.ts
var SandboxVaultIDs = map[string]string{
	"USD": "450d2156-132a-4d3f-88c5-74822547658d",
	"EUR": "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341",
	"GBP": "992b932d-7e9e-44b0-90ea-b82a530b6784",
	"ZAR": "f1c412ce-5e2b-4737-9121-b7c11d6c3f93",
	"MXN": "426c2e30-111e-4273-92b3-508445a6bb58",
	"SGD": "e2914c33-2e57-49a5-ac06-25c006497b3d",
	"CAD": "bd5af6fe-5d92-4b20-9bd4-1baa52b7a02e",
	"EGG": "9a550347-799e-4c10-9142-f1a2e1c084e7",
	"PEB": "0ba2b0d1-b7a2-416c-a4ac-1cb3e5281300",
	"PKR": "2868b4e5-7178-4945-8ec5-8208fac2a22d",
	"XRP": "6e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b",
}

// Reverse mapping: vault_uuid -> currency
var VaultUUIDToCurrency = map[string]string{
	"450d2156-132a-4d3f-88c5-74822547658d": "USD",
	"a09a0a2c-1a3a-44c5-a1b9-603a6eea9341": "EUR",
	"992b932d-7e9e-44b0-90ea-b82a530b6784": "GBP",
	"f1c412ce-5e2b-4737-9121-b7c11d6c3f93": "ZAR",
	"426c2e30-111e-4273-92b3-508445a6bb58": "MXN",
	"e2914c33-2e57-49a5-ac06-25c006497b3d": "SGD",
	"bd5af6fe-5d92-4b20-9bd4-1baa52b7a02e": "CAD",
	"9a550347-799e-4c10-9142-f1a2e1c084e7": "EGG",
	"0ba2b0d1-b7a2-416c-a4ac-1cb3e5281300": "PEB",
	"2868b4e5-7178-4945-8ec5-8208fac2a22d": "PKR",
	"6e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b": "XRP",
}

// Exchange rates (vs USD)
var SandboxRates = map[string]float64{
	"USD": 1.0,
	"EUR": 1.08,
	"GBP": 1.27,
	"ZAR": 0.054,
	"MXN": 0.059,
	"SGD": 0.74,
	"CAD": 0.71,
	"PKR": 0.0036,
	"EGG": 1.0,
	"PEB": 1.0,
	"XRP": 0.50,
}

// KYC states
const (
	KYCStateAccepted       = "accepted"
	KYCStateRejected       = "rejected"
	KYCStateActionRequired = "action_required"
)

// Risk levels
const (
	RiskLevelLow    = "low"
	RiskLevelMedium = "medium"
	RiskLevelHigh   = "high"
)

// Transaction types
const (
	TransactionTypeDeposit = 1
	TransactionTypeHosted  = 2
)

// Deposit types
const (
	DepositTypeExternal = "external"
	DepositTypeHosted   = "hosted"
)

// Wallet types
const (
	WalletTypeStandard = 1
)

// Network types
const (
	NetworkXRPLedger = 30
)

// Webhook event types
const (
	WebhookEventKYCAccepted       = "id.verification.accepted"
	WebhookEventKYCRejected       = "id.verification.rejected"
	WebhookEventKYCActionRequired = "id.verification.action_required"
	WebhookEventDepositCompleted  = "core.deposit.completed"
)

// Pre-seeded test user IDs
const (
	TestUser1ID    = "00000000-0000-0000-0000-000000000001"
	TestUser1Email = "testuser1@mockgatehub.local"
	TestUser2ID    = "00000000-0000-0000-0000-000000000002"
	TestUser2Email = "testuser2@mockgatehub.local"
)
