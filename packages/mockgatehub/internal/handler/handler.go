package handler

import (
	"html/template"
	"net/http"
	"path/filepath"
	"time"

	"mockgatehub/internal/logger"
	"mockgatehub/internal/storage"
	"mockgatehub/internal/webhook"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	store          storage.Storage
	webhookManager *webhook.Manager
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

	// Return success response
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success","message":"Transaction completed"}`))
}
