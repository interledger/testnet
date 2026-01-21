package storage

import (
	"mockgatehub/internal/consts"
	"mockgatehub/internal/models"
)

// SeedTestUsers creates pre-seeded test users with balances
func SeedTestUsers(store Storage) error {
	// Test User 1: USD balance
	user1 := &models.User{
		ID:        consts.TestUser1ID,
		Email:     consts.TestUser1Email,
		Activated: true,
		Managed:   true,
		Role:      "user",
		Features:  []string{"wallet", "kyc"},
		KYCState:  consts.KYCStateActionRequired,
		RiskLevel: consts.RiskLevelLow,
	}

	if err := store.CreateUser(user1); err != nil {
		// User might already exist, ignore error
	}

	// Add 10,000 USD balance
	if err := store.AddBalance(user1.ID, "USD", 10000.00); err != nil {
		return err
	}

	// Test User 2: EUR balance
	user2 := &models.User{
		ID:        consts.TestUser2ID,
		Email:     consts.TestUser2Email,
		Activated: true,
		Managed:   true,
		Role:      "user",
		Features:  []string{"wallet", "kyc"},
		KYCState:  consts.KYCStateActionRequired,
		RiskLevel: consts.RiskLevelLow,
	}

	if err := store.CreateUser(user2); err != nil {
		// User might already exist, ignore error
	}

	// Add 10,000 EUR balance
	if err := store.AddBalance(user2.ID, "EUR", 10000.00); err != nil {
		return err
	}

	return nil
}
