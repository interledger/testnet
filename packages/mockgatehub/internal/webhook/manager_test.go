package webhook

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewManager(t *testing.T) {
	manager := NewManager("http://example.com/webhook", "test-secret")
	assert.NotNil(t, manager)
	assert.Equal(t, "http://example.com/webhook", manager.webhookURL)
	assert.Equal(t, "test-secret", manager.webhookSecret)
}

func TestSendAsync_NoURL(t *testing.T) {
	manager := NewManager("", "secret")

	// Should not panic when URL is empty
	manager.SendAsync("test.event", "user-123", map[string]interface{}{
		"test": "data",
	})

	// Give goroutine time to execute
	time.Sleep(100 * time.Millisecond)
}

func TestSend_Success(t *testing.T) {
	// Create test server
	var receivedPayload WebhookPayload
	var receivedHeaders http.Header

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedHeaders = r.Header.Clone()

		err := json.NewDecoder(r.Body).Decode(&receivedPayload)
		require.NoError(t, err)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}))
	defer server.Close()

	manager := NewManager(server.URL, "test-secret")

	data := map[string]interface{}{
		"amount":   100.50,
		"currency": "USD",
	}

	err := manager.send("core.deposit.completed", "user-123", data)
	require.NoError(t, err)

	// Verify payload
	assert.Equal(t, "core.deposit.completed", receivedPayload.EventType)
	assert.Equal(t, "user-123", receivedPayload.UserUUID)
	assert.Equal(t, 100.50, receivedPayload.Data["amount"])
	assert.Equal(t, "USD", receivedPayload.Data["currency"])

	// Verify headers
	assert.Equal(t, "application/json", receivedHeaders.Get("Content-Type"))
	assert.NotEmpty(t, receivedHeaders.Get("X-GH-Webhook-Signature"))
}

func TestSend_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"server error"}`))
	}))
	defer server.Close()

	manager := NewManager(server.URL, "test-secret")

	err := manager.send("test.event", "user-123", map[string]interface{}{})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unexpected status code: 500")
}

func TestSendWithRetry_Success(t *testing.T) {
	attempts := 0

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 2 {
			// Fail first attempt
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		// Success on second attempt
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	manager := NewManager(server.URL, "test-secret")

	err := manager.sendWithRetry("test.event", "user-123", map[string]interface{}{}, 3)
	require.NoError(t, err)
	assert.Equal(t, 2, attempts)
}

func TestSendWithRetry_AllFail(t *testing.T) {
	attempts := 0

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	manager := NewManager(server.URL, "test-secret")

	err := manager.sendWithRetry("test.event", "user-123", map[string]interface{}{}, 2)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "all 2 attempts failed")
	assert.Equal(t, 2, attempts)
}

func TestSendAsync_Integration(t *testing.T) {
	received := make(chan bool, 1)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received <- true
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	manager := NewManager(server.URL, "test-secret")

	manager.SendAsync("id.verification.accepted", "user-123", map[string]interface{}{
		"kyc_state":  "accepted",
		"risk_level": "low",
	})

	// Wait for webhook to be delivered
	select {
	case <-received:
	// Success
	case <-time.After(5 * time.Second):
		t.Fatal("Webhook not received within timeout")
	}
}
