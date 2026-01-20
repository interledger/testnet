package storage

import (
	"fmt"
	"sync"
	"time"

	"mockgatehub/internal/models"
	"mockgatehub/internal/utils"
)

// MemoryStorage implements Storage using in-memory maps
type MemoryStorage struct {
	mu           sync.RWMutex
	users        map[string]*models.User          // userID -> User
	usersByEmail map[string]*models.User          // email -> User
	wallets      map[string]*models.Wallet        // address -> Wallet
	transactions map[string]*models.Transaction   // txID -> Transaction
	balances     map[string]map[string]float64    // userID -> currency -> amount
}

// NewMemoryStorage creates a new in-memory storage
func NewMemoryStorage() *MemoryStorage {
	return &MemoryStorage{
		users:        make(map[string]*models.User),
		usersByEmail: make(map[string]*models.User),
		wallets:      make(map[string]*models.Wallet),
		transactions: make(map[string]*models.Transaction),
		balances:     make(map[string]map[string]float64),
	}
}

// CreateUser creates a new user
func (s *MemoryStorage) CreateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if user.Email == "" {
		return fmt.Errorf("email is required")
	}

	// Check if email already exists
	if _, exists := s.usersByEmail[user.Email]; exists {
		return fmt.Errorf("user with email %s already exists", user.Email)
	}

	// Generate ID if not provided
	if user.ID == "" {
		user.ID = utils.GenerateUUID()
	}

	// Set defaults
	if user.CreatedAt.IsZero() {
		user.CreatedAt = time.Now()
	}

	s.users[user.ID] = user
	s.usersByEmail[user.Email] = user

	return nil
}

// GetUser retrieves a user by ID
func (s *MemoryStorage) GetUser(id string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, exists := s.users[id]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

// GetUserByEmail retrieves a user by email
func (s *MemoryStorage) GetUserByEmail(email string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, exists := s.usersByEmail[email]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

// UpdateUser updates an existing user
func (s *MemoryStorage) UpdateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	existing, exists := s.users[user.ID]
	if !exists {
		return fmt.Errorf("user not found")
	}

	// Update email index if changed
	if existing.Email != user.Email {
		delete(s.usersByEmail, existing.Email)
		s.usersByEmail[user.Email] = user
	}

	s.users[user.ID] = user
	return nil
}

// CreateWallet creates a new wallet
func (s *MemoryStorage) CreateWallet(wallet *models.Wallet) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if wallet.Address == "" {
		return fmt.Errorf("address is required")
	}

	if _, exists := s.wallets[wallet.Address]; exists {
		return fmt.Errorf("wallet with address %s already exists", wallet.Address)
	}

	if wallet.CreatedAt.IsZero() {
		wallet.CreatedAt = time.Now()
	}

	s.wallets[wallet.Address] = wallet
	return nil
}

// GetWallet retrieves a wallet by address
func (s *MemoryStorage) GetWallet(address string) (*models.Wallet, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	wallet, exists := s.wallets[address]
	if !exists {
		return nil, fmt.Errorf("wallet not found")
	}

	return wallet, nil
}

// GetWalletsByUser retrieves all wallets for a user
func (s *MemoryStorage) GetWalletsByUser(userID string) ([]*models.Wallet, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var wallets []*models.Wallet
	for _, wallet := range s.wallets {
		if wallet.UserID == userID {
			wallets = append(wallets, wallet)
		}
	}

	return wallets, nil
}

// CreateTransaction creates a new transaction
func (s *MemoryStorage) CreateTransaction(tx *models.Transaction) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if tx.ID == "" {
		tx.ID = utils.GenerateUUID()
	}

	if tx.CreatedAt.IsZero() {
		tx.CreatedAt = time.Now()
	}

	s.transactions[tx.ID] = tx
	return nil
}

// GetTransaction retrieves a transaction by ID
func (s *MemoryStorage) GetTransaction(id string) (*models.Transaction, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tx, exists := s.transactions[id]
	if !exists {
		return nil, fmt.Errorf("transaction not found")
	}

	return tx, nil
}

// GetBalance retrieves balance for a user and currency
func (s *MemoryStorage) GetBalance(userID, currency string) (float64, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	userBalances, exists := s.balances[userID]
	if !exists {
		return 0, nil
	}

	return userBalances[currency], nil
}

// AddBalance adds to a user's balance
func (s *MemoryStorage) AddBalance(userID, currency string, amount float64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.balances[userID] == nil {
		s.balances[userID] = make(map[string]float64)
	}

	s.balances[userID][currency] += amount
	return nil
}

// DeductBalance deducts from a user's balance
func (s *MemoryStorage) DeductBalance(userID, currency string, amount float64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.balances[userID] == nil {
		return fmt.Errorf("insufficient balance")
	}

	currentBalance := s.balances[userID][currency]
	if currentBalance < amount {
		return fmt.Errorf("insufficient balance: have %.2f, need %.2f", currentBalance, amount)
	}

	s.balances[userID][currency] -= amount
	return nil
}
