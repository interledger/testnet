package utils

import (
	"crypto/rand"
	"fmt"

	"github.com/google/uuid"
)

// GenerateUUID generates a new UUID v4
func GenerateUUID() string {
	return uuid.New().String()
}

// GenerateMockXRPLAddress generates a mock XRP Ledger address
// Format: r followed by 24-34 alphanumeric characters
func GenerateMockXRPLAddress() string {
	const charset = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
	const length = 33

	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		// Fallback to UUID-based address
		return "r" + uuid.New().String()[:32]
	}

	address := make([]byte, length)
	for i := range address {
		address[i] = charset[int(b[i])%len(charset)]
	}

	return "r" + string(address)
}

// GenerateMockTransactionHash generates a mock transaction hash
func GenerateMockTransactionHash() string {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return uuid.New().String()
	}

	return fmt.Sprintf("%X", b)
}
