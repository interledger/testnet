package storage

import (
	"mockgatehub/internal/models"
)

// Storage defines the interface for data persistence
type Storage interface {
	// Users
	CreateUser(user *models.User) error
	GetUser(id string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUser(user *models.User) error

	// Wallets
	CreateWallet(wallet *models.Wallet) error
	GetWallet(address string) (*models.Wallet, error)
	GetWalletsByUser(userID string) ([]*models.Wallet, error)

	// Transactions
	CreateTransaction(tx *models.Transaction) error
	GetTransaction(id string) (*models.Transaction, error)

	// Balances (per user, per currency)
	GetBalance(userID, currency string) (float64, error)
	AddBalance(userID, currency string, amount float64) error
	DeductBalance(userID, currency string, amount float64) error
}
