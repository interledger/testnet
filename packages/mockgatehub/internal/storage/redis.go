package storage

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"
	"mockgatehub/internal/utils"

	"github.com/redis/go-redis/v9"
)

// RedisStorage implements Storage using Redis
type RedisStorage struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisStorage creates a new Redis storage instance
func NewRedisStorage(redisURL string, db int) (*RedisStorage, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Redis URL: %w", err)
	}

	opt.DB = db

	client := redis.NewClient(opt)
	ctx := context.Background()

	// Ping to verify connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.Info.Printf("Connected to Redis: %s (DB: %d)", redisURL, db)

	return &RedisStorage{
		client: client,
		ctx:    ctx,
	}, nil
}

// Close closes the Redis connection
func (s *RedisStorage) Close() error {
	return s.client.Close()
}

// User operations

func (s *RedisStorage) CreateUser(user *models.User) error {
	if user.Email == "" {
		return errors.New("email is required")
	}

	// Generate ID and timestamps similar to memory storage
	if user.ID == "" {
		user.ID = utils.GenerateUUID()
	}
	if user.CreatedAt.IsZero() {
		user.CreatedAt = time.Now()
	}

	// Check if user exists
	exists, err := s.client.Exists(s.ctx, s.userKey(user.ID)).Result()
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists > 0 {
		return errors.New("user already exists")
	}

	data, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	// Store user by ID
	if err := s.client.Set(s.ctx, s.userKey(user.ID), data, 0).Err(); err != nil {
		return fmt.Errorf("failed to store user: %w", err)
	}

	// Store email → ID mapping
	if err := s.client.Set(s.ctx, s.emailKey(user.Email), user.ID, 0).Err(); err != nil {
		return fmt.Errorf("failed to store email mapping: %w", err)
	}

	return nil
}

func (s *RedisStorage) GetUser(id string) (*models.User, error) {
	data, err := s.client.Get(s.ctx, s.userKey(id)).Result()
	if err == redis.Nil {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	var user models.User
	if err := json.Unmarshal([]byte(data), &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}

	return &user, nil
}

func (s *RedisStorage) GetUserByEmail(email string) (*models.User, error) {
	// Get user ID from email mapping
	userID, err := s.client.Get(s.ctx, s.emailKey(email)).Result()
	if err == redis.Nil {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return s.GetUser(userID)
}

func (s *RedisStorage) UpdateUser(user *models.User) error {
	if user.ID == "" {
		return errors.New("user ID is required")
	}

	// Check if user exists
	exists, err := s.client.Exists(s.ctx, s.userKey(user.ID)).Result()
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists == 0 {
		return errors.New("user not found")
	}

	data, err := json.Marshal(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	if err := s.client.Set(s.ctx, s.userKey(user.ID), data, 0).Err(); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// Wallet operations

func (s *RedisStorage) CreateWallet(wallet *models.Wallet) error {
	if wallet.Address == "" {
		return errors.New("wallet address is required")
	}

	wallet.CreatedAt = time.Now()

	data, err := json.Marshal(wallet)
	if err != nil {
		return fmt.Errorf("failed to marshal wallet: %w", err)
	}

	if err := s.client.Set(s.ctx, s.walletKey(wallet.Address), data, 0).Err(); err != nil {
		return fmt.Errorf("failed to store wallet: %w", err)
	}

	// Add to user's wallet list
	if err := s.client.SAdd(s.ctx, s.userWalletsKey(wallet.UserID), wallet.Address).Err(); err != nil {
		return fmt.Errorf("failed to add wallet to user list: %w", err)
	}

	return nil
}

func (s *RedisStorage) GetWallet(address string) (*models.Wallet, error) {
	data, err := s.client.Get(s.ctx, s.walletKey(address)).Result()
	if err == redis.Nil {
		return nil, errors.New("wallet not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get wallet: %w", err)
	}

	var wallet models.Wallet
	if err := json.Unmarshal([]byte(data), &wallet); err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet: %w", err)
	}

	return &wallet, nil
}

func (s *RedisStorage) GetWalletsByUser(userID string) ([]*models.Wallet, error) {
	addresses, err := s.client.SMembers(s.ctx, s.userWalletsKey(userID)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get user wallets: %w", err)
	}

	var wallets []*models.Wallet
	for _, addr := range addresses {
		wallet, err := s.GetWallet(addr)
		if err == nil {
			wallets = append(wallets, wallet)
		}
	}

	return wallets, nil
}

// Transaction operations

func (s *RedisStorage) CreateTransaction(tx *models.Transaction) error {
	if tx.ID == "" {
		tx.ID = utils.GenerateUUID()
	}

	tx.CreatedAt = time.Now()

	data, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("failed to marshal transaction: %w", err)
	}

	if err := s.client.Set(s.ctx, s.txKey(tx.ID), data, 0).Err(); err != nil {
		return fmt.Errorf("failed to store transaction: %w", err)
	}

	return nil
}

func (s *RedisStorage) GetTransaction(id string) (*models.Transaction, error) {
	data, err := s.client.Get(s.ctx, s.txKey(id)).Result()
	if err == redis.Nil {
		return nil, errors.New("transaction not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	var tx models.Transaction
	if err := json.Unmarshal([]byte(data), &tx); err != nil {
		return nil, fmt.Errorf("failed to unmarshal transaction: %w", err)
	}

	return &tx, nil
}

// Balance operations

func (s *RedisStorage) GetBalance(userID, currency string) (float64, error) {
	val, err := s.client.Get(s.ctx, s.balanceKey(userID, currency)).Result()
	if err == redis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get balance: %w", err)
	}

	balance, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse balance: %w", err)
	}

	return balance, nil
}

func (s *RedisStorage) AddBalance(userID, currency string, amount float64) error {
	if _, err := s.client.IncrByFloat(s.ctx, s.balanceKey(userID, currency), amount).Result(); err != nil {
		return fmt.Errorf("failed to update balance: %w", err)
	}

	return nil
}

func (s *RedisStorage) DeductBalance(userID, currency string, amount float64) error {
	return s.AddBalance(userID, currency, -amount)
}

// Key helpers

func (s *RedisStorage) userKey(id string) string {
	return fmt.Sprintf("user:%s", id)
}

func (s *RedisStorage) emailKey(email string) string {
	return fmt.Sprintf("email:%s", email)
}

func (s *RedisStorage) walletKey(address string) string {
	return fmt.Sprintf("wallet:%s", address)
}

func (s *RedisStorage) userWalletsKey(userID string) string {
	return fmt.Sprintf("user:%s:wallets", userID)
}

func (s *RedisStorage) txKey(id string) string {
	return fmt.Sprintf("tx:%s", id)
}

func (s *RedisStorage) balanceKey(userID, currency string) string {
	return fmt.Sprintf("balance:%s:%s", userID, currency)
}
