package consts

// Supported currencies in sandbox environment
var SandboxCurrencies = []string{
	"XRP", "USD", "EUR", "GBP", "ZAR",
	"MXN", "SGD", "CAD", "EGG", "PEB", "PKR",
}

// Vault UUIDs for each currency (immutable)
var SandboxVaultIDs = map[string]string{
	"USD": "450d2156-132a-4d3f-88c5-74822547658d",
	"EUR": "a09a0a2c-1a3a-44c5-a1b9-603a6eea9341",
	"GBP": "8c3e4d5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f",
	"ZAR": "9d4f5e6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a",
	"MXN": "0e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
	"SGD": "1f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c",
	"CAD": "2a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
	"EGG": "3b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
	"PEB": "4c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f",
	"PKR": "5d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a",
	"XRP": "6e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b",
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
