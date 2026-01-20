package models

// API Request/Response DTOs

// CreateManagedUserRequest is the request for creating a managed user
type CreateManagedUserRequest struct {
	Email string `json:"email"`
}

// CreateManagedUserResponse matches the unmanaged (flat) response returned by mock GateHub
// after the API was aligned to match the wallet backend expectations.
type CreateManagedUserResponse struct {
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	Activated bool     `json:"activated"`
	Managed   bool     `json:"managed"`
	Role      string   `json:"role"`
	Features  []string `json:"features"`
	KYCState  string   `json:"kyc_state"`
	RiskLevel string   `json:"risk_level"`
	CreatedAt string   `json:"created_at"`
}

// GetManagedUserResponse is the response for getting a managed user
type GetManagedUserResponse struct {
	User User `json:"user"`
}

// UpdateEmailRequest is the request for updating user email
type UpdateEmailRequest struct {
	Email    string `json:"email"`
	NewEmail string `json:"new_email"`
}

// StartKYCResponse contains the iframe URL for KYC
type StartKYCResponse struct {
	IframeURL string `json:"iframe_url"`
	Token     string `json:"token"`
}

// UpdateKYCStateRequest is the request for updating KYC state
type UpdateKYCStateRequest struct {
	State     string `json:"state"`
	RiskLevel string `json:"risk_level"`
}

// CreateWalletRequest is the request for creating a wallet
type CreateWalletRequest struct {
	UserID  string `json:"user_id"`
	Name    string `json:"name"`
	Type    int    `json:"type"`
	Network int    `json:"network"`
}

// BalanceItem represents a single currency balance
type BalanceItem struct {
	Currency  string  `json:"currency"`
	VaultUUID string  `json:"vault_uuid"`
	Balance   float64 `json:"balance"`
}

// GetBalanceResponse is the response for wallet balance
type GetBalanceResponse struct {
	Balances []BalanceItem `json:"balances"`
}

// CreateTransactionRequest is the request for creating a transaction
type CreateTransactionRequest struct {
	UserID           string  `json:"user_id"`
	UID              string  `json:"uid"`
	Amount           float64 `json:"amount"`
	Currency         string  `json:"currency"`
	VaultUUID        string  `json:"vault_uuid"`
	ReceivingAddress string  `json:"receiving_address"`
	Type             int     `json:"type"`
	DepositType      string  `json:"deposit_type"`
}

// RateItem represents an exchange rate
type RateItem struct {
	Currency string  `json:"currency"`
	Rate     float64 `json:"rate"`
}

// GetRatesResponse is the response for current rates
type GetRatesResponse struct {
	Rates []RateItem `json:"rates"`
}

// VaultItem represents a liquidity vault
type VaultItem struct {
	Currency string `json:"currency"`
	UUID     string `json:"uuid"`
}

// GetVaultsResponse is the response for liquidity vaults
type GetVaultsResponse struct {
	Vaults []VaultItem `json:"vaults"`
}

// ErrorResponse is a generic error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// TokenResponse is the response for token creation
type TokenResponse struct {
	AccessToken string `json:"access_token"`
	Token       string `json:"token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}
