package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"mockgatehub/internal/storage"
	"mockgatehub/internal/webhook"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestHelper provides utilities for integration testing
type TestHelper struct {
	Handler *Handler
	Store   storage.Storage
}

// NewTestHelper creates a test helper with in-memory storage
func NewTestHelper() *TestHelper {
	store := storage.NewMemoryStorage()
	storage.SeedTestUsers(store)

	webhookManager := webhook.NewManager("", "test-secret")
	handler := NewHandler(store, webhookManager)

	return &TestHelper{
		Handler: handler,
		Store:   store,
	}
}

// MakeRequest makes an HTTP request and returns the response
func (th *TestHelper) MakeRequest(method, path string, body interface{}) (*httptest.ResponseRecorder, error) {
	var bodyReader io.Reader
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewReader(bodyBytes)
	}

	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()

	// Route the request (simplified - in real tests use actual router)
	switch path {
	case "/health":
		th.Handler.HealthCheck(rr, req)
	default:
		rr.WriteHeader(http.StatusNotFound)
	}

	return rr, nil
}

// ParseResponse parses JSON response into target
func (th *TestHelper) ParseResponse(rr *httptest.ResponseRecorder, target interface{}) error {
	return json.NewDecoder(rr.Body).Decode(target)
}

// Integration Test Examples

func TestHealthCheck(t *testing.T) {
	th := NewTestHelper()

	rr, err := th.MakeRequest("GET", "/health", nil)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]string
	err = th.ParseResponse(rr, &response)
	require.NoError(t, err)

	assert.Equal(t, "ok", response["status"])
	assert.Equal(t, "mockgatehub", response["service"])
}

func TestRequestLogger(t *testing.T) {
	th := NewTestHelper()

	// Create a test handler wrapped with the logger
	handler := th.Handler.RequestLogger(http.HandlerFunc(th.Handler.HealthCheck))

	req := httptest.NewRequest("GET", "/health", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
}

func TestSendJSON(t *testing.T) {
	th := NewTestHelper()

	data := map[string]string{"message": "test"}

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)

	// Create a temporary handler just to test sendJSON
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		th.Handler.sendJSON(w, http.StatusOK, data)
	})

	testHandler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))

	var response map[string]string
	err := json.NewDecoder(rr.Body).Decode(&response)
	require.NoError(t, err)
	assert.Equal(t, "test", response["message"])
}

func TestSendError(t *testing.T) {
	th := NewTestHelper()

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)

	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		th.Handler.sendError(w, http.StatusBadRequest, "Invalid input")
	})

	testHandler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)

	var response map[string]string
	err := json.NewDecoder(rr.Body).Decode(&response)
	require.NoError(t, err)
	assert.Equal(t, "Invalid input", response["message"])
}
