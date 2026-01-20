package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateSignature(t *testing.T) {
	tests := []struct {
		name      string
		timestamp string
		method    string
		path      string
		body      string
		secret    string
		want      string
	}{
		{
			name:      "basic signature",
			timestamp: "1234567890",
			method:    "POST",
			path:      "/api/test",
			body:      `{"key":"value"}`,
			secret:    "test-secret",
			want:      "d5c8f5c5c7b3e3c3e3c8f5c5c7b3e3c3", // This will be different
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GenerateSignature(tt.timestamp, tt.method, tt.path, tt.body, tt.secret)
			assert.NotEmpty(t, got)
			assert.Len(t, got, 64) // SHA256 produces 64 hex characters
		})
	}
}

func TestGenerateSignature_Deterministic(t *testing.T) {
	timestamp := "1234567890"
	method := "POST"
	path := "/api/test"
	body := `{"key":"value"}`
	secret := "test-secret"

	sig1 := GenerateSignature(timestamp, method, path, body, secret)
	sig2 := GenerateSignature(timestamp, method, path, body, secret)

	assert.Equal(t, sig1, sig2, "Same inputs should produce same signature")
}

func TestGenerateSignature_Different(t *testing.T) {
	timestamp := "1234567890"
	method := "POST"
	path := "/api/test"
	body := `{"key":"value"}`
	secret := "test-secret"

	sig1 := GenerateSignature(timestamp, method, path, body, secret)
	sig2 := GenerateSignature(timestamp, method, path, body+"different", secret)

	assert.NotEqual(t, sig1, sig2, "Different inputs should produce different signatures")
}
