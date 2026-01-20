package webhook

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"mockgatehub/internal/auth"
	"mockgatehub/internal/logger"
)

// Manager handles webhook delivery
type Manager struct {
	webhookURL    string
	webhookSecret string
	httpClient    *http.Client
}

// WebhookPayload represents the webhook request body
type WebhookPayload struct {
	Event     string                 `json:"event"`
	UserID    string                 `json:"user_id"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// NewManager creates a new webhook manager
func NewManager(webhookURL, webhookSecret string) *Manager {
	logger.Info.Printf("[WEBHOOK] Initializing webhook manager")
	logger.Info.Printf("[WEBHOOK]   URL: %s", webhookURL)
	logger.Info.Printf("[WEBHOOK]   Secret: %s (length: %d)", webhookSecret, len(webhookSecret))
	
	return &Manager{
		webhookURL:    webhookURL,
		webhookSecret: webhookSecret,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendAsync sends a webhook asynchronously with retry logic
func (m *Manager) SendAsync(eventType, userID string, data map[string]interface{}) {
	if m.webhookURL == "" {
		logger.Info.Printf("[WEBHOOK] Skipping webhook send - no URL configured (event: %s, user: %s)", eventType, userID)
		return
	}

	logger.Info.Printf("[WEBHOOK] Queuing async webhook: event=%s, user=%s", eventType, userID)
	logger.Info.Printf("[WEBHOOK]   Data: %+v", data)

	go func() {
		if err := m.sendWithRetry(eventType, userID, data, 3); err != nil {
			logger.Error.Printf("[WEBHOOK] Failed to deliver webhook after retries: %v", err)
		} else {
			logger.Info.Printf("[WEBHOOK] ✅ Webhook delivered successfully: event=%s, user=%s", eventType, userID)
		}
	}()
}

// sendWithRetry attempts to send webhook with exponential backoff
func (m *Manager) sendWithRetry(eventType, userID string, data map[string]interface{}, maxRetries int) error {
	var lastErr error
	
	for attempt := 1; attempt <= maxRetries; attempt++ {
		logger.Info.Printf("[WEBHOOK] Attempt %d/%d: Sending webhook to %s", attempt, maxRetries, m.webhookURL)
		
		err := m.send(eventType, userID, data)
		if err == nil {
			return nil
		}
		
		lastErr = err
		logger.Error.Printf("[WEBHOOK] Attempt %d failed: %v", attempt, err)
		
		if attempt < maxRetries {
			backoff := time.Duration(attempt*attempt) * time.Second
			logger.Info.Printf("[WEBHOOK] Retrying in %v...", backoff)
			time.Sleep(backoff)
		}
	}
	
	return fmt.Errorf("all %d attempts failed, last error: %w", maxRetries, lastErr)
}

// send performs the actual HTTP webhook request
func (m *Manager) send(eventType, userID string, data map[string]interface{}) error {
	// Build payload
	payload := WebhookPayload{
		Event:     eventType,
		UserID:    userID,
		Timestamp: time.Now(),
		Data:      data,
	}
	
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}
	
	logger.Info.Printf("[WEBHOOK] Request body: %s", string(body))
	
	// Create request
	req, err := http.NewRequest("POST", m.webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	
	// Add headers
	req.Header.Set("Content-Type", "application/json")
	
	// Generate HMAC signature
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	signature := auth.GenerateSignature(timestamp, "POST", req.URL.Path, string(body), m.webhookSecret)
	
	req.Header.Set("X-Webhook-Timestamp", timestamp)
	req.Header.Set("X-Webhook-Signature", signature)
	
	logger.Info.Printf("[WEBHOOK] Request headers:")
	logger.Info.Printf("[WEBHOOK]   Content-Type: application/json")
	logger.Info.Printf("[WEBHOOK]   X-Webhook-Timestamp: %s", timestamp)
	logger.Info.Printf("[WEBHOOK]   X-Webhook-Signature: %s", signature)
	logger.Info.Printf("[WEBHOOK]   Secret used: %s", m.webhookSecret)
	
	// Send request
	logger.Info.Printf("[WEBHOOK] Sending POST request to %s", m.webhookURL)
	start := time.Now()
	resp, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	duration := time.Since(start)
	logger.Info.Printf("[WEBHOOK] Response received in %v: status=%d %s", duration, resp.StatusCode, resp.Status)
	
	// Read response body
	respBody, _ := io.ReadAll(resp.Body)
	if len(respBody) > 0 {
		logger.Info.Printf("[WEBHOOK] Response body: %s", string(respBody))
	} else {
		logger.Info.Printf("[WEBHOOK] Response body: (empty)")
	}
	
	// Check status code
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("unexpected status code: %d %s", resp.StatusCode, resp.Status)
	}
	
	return nil
}
