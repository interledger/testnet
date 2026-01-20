package storage

import (
	"testing"
	"time"

	"mockgatehub/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRedisStorage tests the Redis storage implementation
// Requires Redis running on localhost:6379
func TestRedisStorage(t *testing.T) {
	// Skip if Redis is not available
	store, err := NewRedisStorage("redis://localhost:6379", 15)
	if err != nil {
		t.Skip("Redis not available, skipping integration tests")
		return
	}
	defer store.Close()

	// Clean up test database
	_ = store.client.FlushDB(store.ctx).Err()

	t.Run("User Operations", func(t *testing.T) {
		user := &models.User{Email: "redis@test.com"}
		err := store.CreateUser(user)
		require.NoError(t, err)
		assert.NotEmpty(t, user.ID)

		retrieved, err := store.GetUser(user.ID)
		require.NoError(t, err)
		assert.Equal(t, user.Email, retrieved.Email)

		retrievedByEmail, err := store.GetUserByEmail(user.Email)
		require.NoError(t, err)
		assert.Equal(t, user.ID, retrievedByEmail.ID)

		user.Email = "updated@test.com"
		err = store.UpdateUser(user)
		require.NoError(t, err)

		updated, err := store.GetUser(user.ID)
		require.NoError(t, err)
		assert.Equal(t, "updated@test.com", updated.Email)
	})

	t.Run("Wallet Operations", func(t *testing.T) {
		user := &models.User{Email: "wallet-user@test.com"}
		err := store.CreateUser(user)
		require.NoError(t, err)

		wallet := &models.Wallet{
			Address: "rTestAddress123",
			UserID:  user.ID,
			Name:    "Test Wallet",
		}

		err = store.CreateWallet(wallet)
		require.NoError(t, err)
		assert.NotZero(t, wallet.CreatedAt)

		retrieved, err := store.GetWallet(wallet.Address)
		require.NoError(t, err)
		assert.Equal(t, wallet.UserID, retrieved.UserID)

		wallets, err := store.GetWalletsByUser(user.ID)
		require.NoError(t, err)
		assert.Len(t, wallets, 1)
	})

	t.Run("Transaction Operations", func(t *testing.T) {
		user := &models.User{Email: "tx-user@test.com"}
		err := store.CreateUser(user)
		require.NoError(t, err)

		tx := &models.Transaction{
			UserID:   user.ID,
			Amount:   100.50,
			Currency: "USD",
			Status:   "completed",
		}

		err = store.CreateTransaction(tx)
		require.NoError(t, err)
		assert.NotEmpty(t, tx.ID)
		assert.NotZero(t, tx.CreatedAt)

		retrieved, err := store.GetTransaction(tx.ID)
		require.NoError(t, err)
		assert.Equal(t, tx.Amount, retrieved.Amount)
	})

	t.Run("Balance Operations", func(t *testing.T) {
		user := &models.User{Email: "balance-user@test.com"}
		err := store.CreateUser(user)
		require.NoError(t, err)

		balance, err := store.GetBalance(user.ID, "USD")
		require.NoError(t, err)
		assert.Equal(t, 0.0, balance)

		err = store.AddBalance(user.ID, "USD", 100.0)
		require.NoError(t, err)

		balance, err = store.GetBalance(user.ID, "USD")
		require.NoError(t, err)
		assert.Equal(t, 100.0, balance)

		err = store.DeductBalance(user.ID, "USD", 30.0)
		require.NoError(t, err)

		balance, err = store.GetBalance(user.ID, "USD")
		require.NoError(t, err)
		assert.Equal(t, 70.0, balance)
	})
}

// Test Redis connection error
func TestRedisConnectionError(t *testing.T) {
	_, err := NewRedisStorage("redis://localhost:99999", 0)
	assert.Error(t, err)
}

// Test Redis URL parsing error
func TestRedisInvalidURL(t *testing.T) {
	_, err := NewRedisStorage("invalid-url", 0)
	assert.Error(t, err)
}

// Test concurrent access
func TestRedisConcurrency(t *testing.T) {
	store, err := NewRedisStorage("redis://localhost:6379", 15)
	if err != nil {
		t.Skip("Redis not available, skipping integration tests")
		return
	}
	defer store.Close()

	// Clean up
	_ = store.client.FlushDB(store.ctx).Err()

	// Seed a user
	user := &models.User{Email: "concurrent@test.com"}
	require.NoError(t, store.CreateUser(user))

	// Concurrent balance updates (same as memory test)
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				_ = store.AddBalance(user.ID, "USD", 1.0)
			}
			done <- true
		}()
	}

	for i := 0; i < 10; i++ {
		<-done
	}

	balance, err := store.GetBalance(user.ID, "USD")
	require.NoError(t, err)
	assert.Equal(t, 1000.0, balance)

	// Wait a bit for Redis to settle
	time.Sleep(100 * time.Millisecond)
}
