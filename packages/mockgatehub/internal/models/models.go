package models

import "time"

// User represents a Gatehub user
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Activated bool      `json:"activated"`
	Managed   bool      `json:"managed"`
	Role      string    `json:"role"`
	Features  []string  `json:"features"`
	KYCState  string    `json:"kyc_state"`  // accepted/rejected/action_required
	RiskLevel string    `json:"risk_level"` // low/medium/high
	CreatedAt time.Time `json:"created_at"`
}

// Wallet represents an XRPL wallet
type Wallet struct {
	Address   string    `json:"address"`  // Mock XRPL address
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Type      int       `json:"type"`
	Network   int       `json:"network"`  // 30 for XRP Ledger
	CreatedAt time.Time `json:"created_at"`
}

// Transaction represents a deposit or transaction
type Transaction struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	UID              string    `json:"uid"` // External reference
	Amount           float64   `json:"amount"`
	Currency         string    `json:"currency"`
	VaultUUID        string    `json:"vault_uuid"`
	ReceivingAddress string    `json:"receiving_address"`
	Type             int       `json:"type"`         // 1=deposit, 2=hosted
	DepositType      string    `json:"deposit_type"` // external/hosted
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}
