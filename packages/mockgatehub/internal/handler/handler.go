package handler

import (
	"net/http"
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
