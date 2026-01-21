package handler

import (
	"encoding/json"
	"html/template"
	"io"
	"net/http"
	"path/filepath"
	"sync"
	"time"

	"mockgatehub/internal/consts"
	"mockgatehub/internal/logger"
	"mockgatehub/internal/storage"
	"mockgatehub/internal/utils"
	"mockgatehub/internal/webhook"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	store          storage.Storage
	webhookManager *webhook.Manager
	tokenToUser    sync.Map // Maps bearer tokens to user UUIDs
}

// NewHandler creates a new handler with dependencies
func NewHandler(store storage.Storage, webhookManager *webhook.Manager) *Handler {
	logger.Info.Println("[HANDLER] Initializing HTTP handlers")
	return &Handler{
		store:          store,
		webhookManager: webhookManager,
	}
}

// RequestLogger middleware logs all incoming requests
func (h *Handler) RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		logger.Info.Printf("[REQUEST] --> %s %s", r.Method, r.URL.Path)
		logger.Info.Printf("[REQUEST]     From: %s", r.RemoteAddr)
		logger.Info.Printf("[REQUEST]     User-Agent: %s", r.UserAgent())

		// Log query parameters
		if len(r.URL.Query()) > 0 {
			logger.Info.Printf("[REQUEST]     Query params: %v", r.URL.Query())
		}

		// Log important headers
		if contentType := r.Header.Get("Content-Type"); contentType != "" {
			logger.Info.Printf("[REQUEST]     Content-Type: %s", contentType)
		}
		if auth := r.Header.Get("Authorization"); auth != "" {
			logger.Info.Printf("[REQUEST]     Authorization: %s", auth)
		}

		next.ServeHTTP(w, r)

		duration := time.Since(start)
		logger.Info.Printf("[REQUEST] <-- %s %s completed in %v", r.Method, r.URL.Path, duration)
	})
}

// HealthCheck handles the health check endpoint
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	logger.Info.Println("[HANDLER] Health check requested")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","service":"mockgatehub"}`))
}

// RootHandler serves the main iframe page for deposit/onboarding
func (h *Handler) RootHandler(w http.ResponseWriter, r *http.Request) {
	logger.Info.Println("[HANDLER] Root handler requested")

	paymentType := r.URL.Query().Get("paymentType")
	bearer := r.URL.Query().Get("bearer")

	if bearer == "" {
		logger.Error.Println("[HANDLER] Missing bearer token in root request")
		http.Error(w, "Missing bearer token", http.StatusBadRequest)
		return
	}

	logger.Info.Printf("[HANDLER] Serving iframe for paymentType=%s with bearer token", paymentType)

	// If no paymentType is provided, treat this as onboarding and serve the KYC iframe
	if paymentType == "" || paymentType == "onboarding" {
		// Try to extract user UUID from bearer token mapping
		userUUID := h.extractUserFromBearer(bearer)

		// If not found in mapping, try to get from query params (user_id might be passed from frontend)
		if userUUID == "" {
			userUUID = r.URL.Query().Get("user_id")
		}

		if userUUID == "" {
			logger.Warn.Printf("[HANDLER] Could not extract user from bearer token or query params, will rely on form submission")
		}

		// Load KYC iframe template
		kycTemplatePath := filepath.Join("web", "kyc-iframe.html")
		kycTmpl, err := template.ParseFiles(kycTemplatePath)
		if err != nil {
			logger.Error.Printf("[HANDLER] Failed to parse KYC iframe template: %v", err)
			http.Error(w, "Template error", http.StatusInternalServerError)
			return
		}

		// Prepare data for KYC template - pass bearer token to be used on submission
		kycData := map[string]string{
			"Token":  bearer,
			"UserID": userUUID,
		}

		// Set headers
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Render KYC iframe
		if err := kycTmpl.Execute(w, kycData); err != nil {
			logger.Error.Printf("[HANDLER] Failed to execute KYC iframe template: %v", err)
			http.Error(w, "Template execution error", http.StatusInternalServerError)
			return
		}
		return
	}

	// Otherwise, serve the generic payment iframe (deposit/withdrawal/exchange)
	bearerShort := bearer
	if len(bearer) > 20 {
		bearerShort = bearer[:20] + "..."
	}

	// Load template from web folder
	templatePath := filepath.Join("web", "index.html")
	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		logger.Error.Printf("[HANDLER] Failed to parse template: %v", err)
		http.Error(w, "Template error", http.StatusInternalServerError)
		return
	}

	// Prepare data for template
	data := map[string]string{
		"PaymentType": paymentType,
		"Bearer":      bearer,
		"BearerShort": bearerShort,
	}

	// Set headers
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Render template
	if err := tmpl.Execute(w, data); err != nil {
		logger.Error.Printf("[HANDLER] Failed to execute template: %v", err)
		http.Error(w, "Template execution error", http.StatusInternalServerError)
		return
	}
}

// TransactionCompleteHandler handles transaction completion callbacks from the iframe
func (h *Handler) TransactionCompleteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.WriteHeader(http.StatusOK)
		return
	}

	logger.Info.Println("[HANDLER] Transaction complete handler requested")

	paymentType := r.URL.Query().Get("paymentType")
	bearer := r.URL.Query().Get("bearer")

	if bearer == "" {
		logger.Error.Println("[HANDLER] Missing bearer token in transaction completion")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"Missing bearer token"}`))
		return
	}

	logger.Info.Printf("[HANDLER] Transaction completed for paymentType=%s with bearer token", paymentType)

	// Parse request body for transaction details (amount, currency, etc.)
	type TransactionRequest struct {
		Amount   string `json:"amount"`
		Currency string `json:"currency"`
	}

	var txReq TransactionRequest
	// Default values if body is empty or parsing fails
	txReq.Amount = "100.00"
	txReq.Currency = "USD"

	if r.Body != nil {
		bodyBytes, err := io.ReadAll(r.Body)
		if err == nil && len(bodyBytes) > 0 {
			if err := json.Unmarshal(bodyBytes, &txReq); err == nil {
				logger.Info.Printf("[HANDLER] Parsed transaction details: amount=%s, currency=%s", txReq.Amount, txReq.Currency)
			} else {
				logger.Warn.Printf("[HANDLER] Failed to parse request body, using defaults: %v", err)
			}
		}
	}

	// For deposit type, send a webhook to wallet-backend
	if paymentType == "deposit" {
		// Decode bearer to get user UUID
		// In a real implementation, we would validate the JWT token
		// For mock purposes, we extract the user UUID from a simple format
		userUUID := h.extractUserFromBearer(bearer)

		if userUUID != "" {
			// Get user to find their wallet address
			user, err := h.store.GetUser(userUUID)
			if err == nil && user != nil {
				// Get user's wallets to find the deposit address
				wallets, err := h.store.GetWalletsByUser(userUUID)
				if err == nil && len(wallets) > 0 {
					// Use the first wallet's address
					walletAddress := wallets[0].Address

					// Get vault_uuid for the currency (from consts)
					vaultUUID := consts.SandboxVaultIDs[txReq.Currency]
					if vaultUUID == "" {
						// Fallback to USD vault if currency not found
						vaultUUID = consts.SandboxVaultIDs["USD"]
						logger.Warn.Printf("[HANDLER] Unknown currency %s, using USD vault", txReq.Currency)
					}

					// Send deposit webhook (matches GateHub webhook spec) with dynamic values
					h.webhookManager.SendAsync("core.deposit.completed", userUUID, map[string]interface{}{
						"tx_uuid":      utils.GenerateUUID(),
						"amount":       txReq.Amount,   // From iframe form
						"currency":     txReq.Currency, // From iframe form
						"vault_uuid":   vaultUUID,      // Vault UUID for this currency
						"address":      walletAddress,  // The wallet address that received the deposit
						"deposit_type": "external",     // External deposit type (lowercase per spec)
						"total_fees":   "0",            // Fees charged (matches GateHub spec)
					})

					logger.Info.Printf("[HANDLER] Sent deposit webhook for user %s: %s %s to wallet %s", userUUID, txReq.Amount, txReq.Currency, walletAddress)
				} else {
					logger.Error.Printf("[HANDLER] No wallets found for user %s", userUUID)
				}
			} else {
				logger.Error.Printf("[HANDLER] User not found: %s, error: %v", userUUID, err)
			}
		} else {
			logger.Warn.Println("[HANDLER] Could not extract user UUID from bearer token")
		}
	}

	// Return success response
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success","message":"Transaction completed"}`))
}

// extractUserFromBearer extracts the user UUID from the bearer token
func (h *Handler) extractUserFromBearer(bearer string) string {
	// Look up the user UUID from the token mapping
	if userUUID, ok := h.tokenToUser.Load(bearer); ok {
		if uuid, ok := userUUID.(string); ok {
			return uuid
		}
	}

	logger.Warn.Printf("[HANDLER] Bearer token not found in mapping: %s", bearer[:min(len(bearer), 20)])
	return ""
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
