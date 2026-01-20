package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

// GenerateSignature generates an HMAC-SHA256 signature
// Format: HMAC-SHA256(timestamp + method + path + body, secret)
func GenerateSignature(timestamp, method, path, body, secret string) string {
	message := timestamp + method + path + body
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	return hex.EncodeToString(mac.Sum(nil))
}

// ValidateSignature validates an incoming request signature
func ValidateSignature(r *http.Request, secret string) (bool, error) {
	// Extract headers
	timestamp := r.Header.Get("x-gatehub-timestamp")
	signature := r.Header.Get("x-gatehub-signature")
	appID := r.Header.Get("x-gatehub-app-id")

	if timestamp == "" || signature == "" || appID == "" {
		return false, fmt.Errorf("missing required headers")
	}

	// Validate timestamp (allow 5 minute window)
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return false, fmt.Errorf("invalid timestamp format")
	}

	now := time.Now().Unix()
	if now-ts > 300 || ts-now > 300 {
		return false, fmt.Errorf("timestamp out of acceptable range")
	}

	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read body")
	}

	// Generate expected signature
	method := r.Method
	path := r.URL.Path
	expectedSig := GenerateSignature(timestamp, method, path, string(body), secret)

	// Compare signatures (constant time)
	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		return false, fmt.Errorf("signature mismatch")
	}

	return true, nil
}

// SignRequest adds signature headers to an outgoing request
func SignRequest(r *http.Request, secret string, body []byte) {
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	method := r.Method
	path := r.URL.Path

	signature := GenerateSignature(timestamp, method, path, string(body), secret)

	r.Header.Set("x-gatehub-timestamp", timestamp)
	r.Header.Set("x-gatehub-signature", signature)
	r.Header.Set("x-gatehub-app-id", "mockgatehub")
}
