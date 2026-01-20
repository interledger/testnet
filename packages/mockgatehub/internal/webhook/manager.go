package webhook

import (
	"net/http"
	"time"
)

// Manager handles webhook delivery
type Manager struct {
	webhookURL    string
	webhookSecret string
	httpClient    *http.Client
}

// NewManager creates a new webhook manager
func NewManager(webhookURL, webhookSecret string) *Manager {
	return &Manager{
		webhookURL:    webhookURL,
		webhookSecret: webhookSecret,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendAsync sends a webhook asynchronously (stub for now)
func (m *Manager) SendAsync(eventType, userID string, data map[string]interface{}) {
	// Will be implemented in Phase 6
	go func() {
		// Stub - actual implementation will send HTTP request with retry logic
	}()
}
