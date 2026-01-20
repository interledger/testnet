package storage

import (
	"testing"
	"time"

	"mockgatehub/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMemoryStorage_CreateUser(t *testing.T) {
	store := NewMemoryStorage()

	user := &models.User{
		Email: "test@example.com",
	}

	err := store.CreateUser(user)
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.NotZero(t, user.CreatedAt)
}

func TestMemoryStorage_CreateUser_DuplicateEmail(t *testing.T) {
	store := NewMemoryStorage()

	user1 := &models.User{Email: "test@example.com"}
	err := store.CreateUser(user1)
	require.NoError(t, err)

	user2 := &models.User{Email: "test@example.com"}
	err = store.CreateUser(user2)
	assert.Error(t, err)
}

func TestMemoryStorage_GetUser(t *testing.T) {
	store := NewMemoryStorage()

	user := &models.User{Email: "test@example.com"}
	err := store.CreateUser(user)
	require.NoError(t, err)

	retrieved, err := store.GetUser(user.ID)
	require.NoError(t, err)
	assert.Equal(t, user.Email, retrieved.Email)
}

func TestMemoryStorage_GetUserByEmail(t *testing.T) {
	store := NewMemoryStorage()

	user := &models.User{Email: "test@example.com"}
	err := store.CreateUser(user)
	require.NoError(t, err)

	retrieved, err := store.GetUserByEmail("test@example.com")
	require.NoError(t, err)
	assert.Equal(t, user.ID, retrieved.ID)
}

func TestMemoryStorage_UpdateUser(t *testing.T) {
	store := NewMemoryStorage()

	user := &models.User{Email: "test@example.com"}
	err := store.CreateUser(user)
	require.NoError(t, err)

	user.KYCState = "accepted"
	err = store.UpdateUser(user)
	require.NoError(t, err)

	retrieved, err := store.GetUser(user.ID)
	require.NoError(t, err)
	assert.Equal(t, "accepted", retrieved.KYCState)
}

func TestMemoryStorage_CreateWallet(t *testing.T) {
	store := NewMemoryStorage()

	wallet := &models.Wallet{
		Address: "rTestAddress123",
		UserID:  "user-123",
		Name:    "My Wallet",
	}

	err := store.CreateWallet(wallet)
	require.NoError(t, err)
	assert.NotZero(t, wallet.CreatedAt)
}

func TestMemoryStorage_GetWallet(t *testing.T) {
	store := NewMemoryStorage()

	wallet := &models.Wallet{
		Address: "rTestAddress123",
		UserID:  "user-123",
	}
	err := store.CreateWallet(wallet)
	require.NoError(t, err)

	retrieved, err := store.GetWallet("rTestAddress123")
	require.NoError(t, err)
	assert.Equal(t, wallet.UserID, retrieved.UserID)
}

func TestMemoryStorage_GetWalletsByUser(t *testing.T) {
	store := NewMemoryStorage()

	wallet1 := &models.Wallet{Address: "rAddr1", UserID: "user-123"}
	wallet2 := &models.Wallet{Address: "rAddr2", UserID: "user-123"}
	wallet3 := &models.Wallet{Address: "rAddr3", UserID: "user-456"}

	store.CreateWallet(wallet1)
	store.CreateWallet(wallet2)
	store.CreateWallet(wallet3)

	wallets, err := store.GetWalletsByUser("user-123")
	require.NoError(t, err)
	assert.Len(t, wallets, 2)
}

func TestMemoryStorage_CreateTransaction(t *testing.T) {
	store := NewMemoryStorage()

	tx := &models.Transaction{
		UserID:   "user-123",
		Amount:   100.50,
		Currency: "USD",
	}

	err := store.CreateTransaction(tx)
	require.NoError(t, err)
	assert.NotEmpty(t, tx.ID)
	assert.NotZero(t, tx.CreatedAt)
}

func TestMemoryStorage_GetTransaction(t *testing.T) {
	store := NewMemoryStorage()

	tx := &models.Transaction{
		UserID:   "user-123",
		Amount:   100.50,
		Currency: "USD",
	}
	err := store.CreateTransaction(tx)
	require.NoError(t, err)

	retrieved, err := store.GetTransaction(tx.ID)
	require.NoError(t, err)
	assert.Equal(t, tx.Amount, retrieved.Amount)
}

func TestMemoryStorage_Balance(t *testing.T) {
	store := NewMemoryStorage()

	// Initial balance should be 0
	balance, err := store.GetBalance("user-123", "USD")
	require.NoError(t, err)
	assert.Equal(t, 0.0, balance)

	// Add balance
	err = store.AddBalance("user-123", "USD", 100.50)
	require.NoError(t, err)

	balance, err = store.GetBalance("user-123", "USD")
	require.NoError(t, err)
	assert.Equal(t, 100.50, balance)

	// Add more
	err = store.AddBalance("user-123", "USD", 50.25)
	require.NoError(t, err)

	balance, err = store.GetBalance("user-123", "USD")
	require.NoError(t, err)
	assert.Equal(t, 150.75, balance)

	// Deduct
	err = store.DeductBalance("user-123", "USD", 50.00)
	require.NoError(t, err)

	balance, err = store.GetBalance("user-123", "USD")
	require.NoError(t, err)
	assert.Equal(t, 100.75, balance)
}

func TestMemoryStorage_DeductBalance_Insufficient(t *testing.T) {
	store := NewMemoryStorage()

	err := store.AddBalance("user-123", "USD", 50.00)
	require.NoError(t, err)

	err = store.DeductBalance("user-123", "USD", 100.00)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "insufficient balance")
}

func TestMemoryStorage_Concurrent(t *testing.T) {
	store := NewMemoryStorage()

	// Test concurrent writes
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func(i int) {
			user := &models.User{
				Email:     "test" + string(rune(i)) + "@example.com",
				CreatedAt: time.Now(),
			}
			store.CreateUser(user)
			done <- true
		}(i)
	}

	for i := 0; i < 10; i++ {
		<-done
	}

	// Verify all users were created
	assert.Len(t, store.users, 10)
}
