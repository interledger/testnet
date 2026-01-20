package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"mockgatehub/internal/handler"
	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"
	"mockgatehub/internal/storage"
	"mockgatehub/internal/webhook"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestServer wraps the HTTP server for integration testing
type TestServer struct {
	Router  *chi.Mux
	Store   storage.Storage
	Handler *handler.Handler
}

// NewTestServer creates a test server with in-memory storage
func NewTestServer() *TestServer {
	logger.Info.Println("[TEST] Creating test server")

	store := storage.NewMemoryStorage()
	if err := storage.SeedTestUsers(store); err != nil {
		panic(fmt.Sprintf("Failed to seed test users: %v", err))
	}

	webhookManager := webhook.NewManager("", "test-secret")
	h := handler.NewHandler(store, webhookManager)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// Setup routes (same as main.go)
	r.Get("/health", h.HealthCheck)
	r.Route("/auth/v1", func(r chi.Router) {
		r.Post("/tokens", h.CreateToken)
		r.Post("/users/managed", h.CreateManagedUser)
		r.Get("/users/managed", h.GetManagedUser)
		r.Put("/users/managed/email", h.UpdateManagedUserEmail)
	})
	r.Route("/id/v1", func(r chi.Router) {
		r.Get("/users/{userID}", h.GetUser)
		r.Post("/users/{userID}/hubs/{gatewayID}", h.StartKYC)
		r.Put("/hubs/{gatewayID}/users/{userID}", h.UpdateKYCState)
	})
	r.Get("/iframe/onboarding", h.KYCIframe)
	r.Post("/iframe/submit", h.KYCIframeSubmit)
	r.Route("/core/v1", func(r chi.Router) {
		r.Post("/wallets", h.CreateWallet)
		r.Get("/wallets/{address}", h.GetWallet)
		r.Get("/wallets/{address}/balance", h.GetWalletBalance)
		r.Post("/transactions", h.CreateTransaction)
		r.Get("/transactions/{txID}", h.GetTransaction)
	})
	r.Route("/rates/v1", func(r chi.Router) {
		r.Get("/rates/current", h.GetCurrentRates)
		r.Get("/liquidity_provider/vaults", h.GetVaults)
	})
	r.Route("/cards/v1", func(r chi.Router) {
		r.Post("/customers/managed", h.CreateManagedCustomer)
		r.Post("/cards", h.CreateCard)
		r.Get("/cards/{cardID}", h.GetCard)
		r.Delete("/cards/{cardID}", h.DeleteCard)
	})

	return &TestServer{
		Router:  r,
		Store:   store,
		Handler: h,
	}
}

// MakeRequest makes an HTTP request to the test server
func (ts *TestServer) MakeRequest(method, path string, body interface{}) *httptest.ResponseRecorder {
	var bodyReader *bytes.Reader
	if body != nil {
		bodyBytes, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(bodyBytes)
		req := httptest.NewRequest(method, path, bodyReader)
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		ts.Router.ServeHTTP(rr, req)
		return rr
	}

	req := httptest.NewRequest(method, path, nil)
	rr := httptest.NewRecorder()
	ts.Router.ServeHTTP(rr, req)
	return rr
}

// Full Workflow Integration Tests

func TestFullUserJourney(t *testing.T) {
	logger.Info.Println("\n=== Starting Full User Journey Test ===")
	ts := NewTestServer()

	// 1. Create a new managed user
	logger.Info.Println("[TEST] Step 1: Create managed user")
	createUserReq := models.CreateManagedUserRequest{
		Email: "newuser@example.com",
	}
	rr := ts.MakeRequest("POST", "/auth/v1/users/managed", createUserReq)
	require.Equal(t, http.StatusCreated, rr.Code, "Failed to create user: %s", rr.Body.String())

	var createUserResp models.CreateManagedUserResponse
	err := json.NewDecoder(rr.Body).Decode(&createUserResp)
	require.NoError(t, err)
	user := models.User{
		ID:        createUserResp.ID,
		Email:     createUserResp.Email,
		Activated: createUserResp.Activated,
		Managed:   createUserResp.Managed,
		Role:      createUserResp.Role,
		Features:  createUserResp.Features,
		KYCState:  createUserResp.KYCState,
		RiskLevel: createUserResp.RiskLevel,
	}

	// 2. Start KYC process
	logger.Info.Println("[TEST] Step 2: Start KYC")
	kycPath := fmt.Sprintf("/id/v1/users/%s/hubs/gateway-1", user.ID)
	rr = ts.MakeRequest("POST", kycPath, nil)
	require.Equal(t, http.StatusOK, rr.Code)

	var kycResponse models.StartKYCResponse
	err = json.NewDecoder(rr.Body).Decode(&kycResponse)
	require.NoError(t, err)
	assert.NotEmpty(t, kycResponse.IframeURL)
	logger.Info.Printf("[TEST] KYC iframe URL: %s", kycResponse.IframeURL)

	// 3. Verify user is auto-approved
	logger.Info.Println("[TEST] Step 3: Verify KYC auto-approval")
	time.Sleep(100 * time.Millisecond) // Let goroutine complete
	userPath := fmt.Sprintf("/id/v1/users/%s", user.ID)
	rr = ts.MakeRequest("GET", userPath, nil)
	require.Equal(t, http.StatusOK, rr.Code)

	err = json.NewDecoder(rr.Body).Decode(&user)
	require.NoError(t, err)
	assert.Equal(t, "accepted", user.KYCState)
	assert.Equal(t, "low", user.RiskLevel)
	logger.Info.Printf("[TEST] KYC Status: %s, Risk: %s", user.KYCState, user.RiskLevel)

	// 4. Create a wallet
	logger.Info.Println("[TEST] Step 4: Create wallet")
	createWalletReq := models.CreateWalletRequest{
		UserID: user.ID,
		Name:   "My Test Wallet",
	}
	rr = ts.MakeRequest("POST", "/core/v1/wallets", createWalletReq)
	require.Equal(t, http.StatusCreated, rr.Code, "Failed to create wallet: %s", rr.Body.String())

	var wallet models.Wallet
	err = json.NewDecoder(rr.Body).Decode(&wallet)
	require.NoError(t, err)
	assert.NotEmpty(t, wallet.Address)
	assert.Equal(t, user.ID, wallet.UserID)
	logger.Info.Printf("[TEST] Created wallet: %s", wallet.Address)

	// 5. Deposit funds
	logger.Info.Println("[TEST] Step 5: Deposit funds")
	depositReq := models.CreateTransactionRequest{
		UserID:   user.ID,
		Amount:   500.00,
		Currency: "USD",
	}
	rr = ts.MakeRequest("POST", "/core/v1/transactions", depositReq)
	require.Equal(t, http.StatusCreated, rr.Code, "Failed to create transaction: %s", rr.Body.String())

	var tx models.Transaction
	err = json.NewDecoder(rr.Body).Decode(&tx)
	require.NoError(t, err)
	assert.Equal(t, 500.00, tx.Amount)
	assert.Equal(t, "USD", tx.Currency)
	logger.Info.Printf("[TEST] Deposited: %.2f %s (TX: %s)", tx.Amount, tx.Currency, tx.ID)

	// 6. Check balance (all currencies)
	logger.Info.Println("[TEST] Step 6: Check balance")
	balancePath := fmt.Sprintf("/core/v1/wallets/%s/balance", wallet.Address)
	rr = ts.MakeRequest("GET", balancePath, nil)
	require.Equal(t, http.StatusOK, rr.Code)

	var balances []map[string]interface{}
	err = json.NewDecoder(rr.Body).Decode(&balances)
	require.NoError(t, err)
	require.NotEmpty(t, balances)
	assert.Equal(t, "USD", balances[1]["vault"].(map[string]interface{})["asset_code"])

	// Find USD balance
	var usdBalance float64
	for _, bal := range balances {
		v := bal["vault"].(map[string]interface{})
		if v["asset_code"] == "USD" {
			valStr, _ := bal["available"].(string)
			fmt.Sscan(valStr, &usdBalance)
			assert.NotEmpty(t, v["uuid"])
			logger.Info.Printf("[TEST] USD Balance: %s (Vault: %s)", valStr, v["uuid"])
		}
	}
	assert.Equal(t, 500.00, usdBalance)

	logger.Info.Println("[TEST] ✅ Full user journey completed successfully!")
}

func TestKYCIframe(t *testing.T) {
	ts := NewTestServer()

	rr := ts.MakeRequest("GET", "/iframe/onboarding?token=test-token&user_id=test-user", nil)
	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "text/html", rr.Header().Get("Content-Type"))
	assert.Contains(t, rr.Body.String(), "KYC Verification")
	assert.Contains(t, rr.Body.String(), "MockGatehub")
}
