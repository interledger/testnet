package handler

import (
	"net/http"

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
	return &Handler{
		store:          store,
		webhookManager: webhookManager,
	}
}

// HealthCheck handles the health check endpoint
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}
