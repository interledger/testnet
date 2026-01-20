package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"
)

// Helper methods for JSON responses

func (h *Handler) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	
	// Marshal to log the response
	body, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		logger.Error.Printf("[HANDLER] Failed to marshal response: %v", err)
		w.Write([]byte(`{"error":"internal server error"}`))
		return
	}
	
	logger.Info.Printf("[HANDLER] Response [%d]: %s", status, string(body))
	w.Write(body)
}

func (h *Handler) sendError(w http.ResponseWriter, status int, message string) {
	logger.Error.Printf("[HANDLER] Error response [%d]: %s", status, message)
	h.sendJSON(w, status, models.ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
	})
}

func (h *Handler) decodeJSON(r *http.Request, v interface{}) error {
	// Read body for logging
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return fmt.Errorf("failed to read body: %w", err)
	}
	
	// Log the raw request body
	logger.Info.Printf("[HANDLER] Request body: %s", string(body))
	
	// Restore body for decoding
	r.Body = io.NopCloser(bytes.NewReader(body))
	
	// Decode
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		logger.Error.Printf("[HANDLER] Failed to decode JSON: %v", err)
		return err
	}
	
	// Log the decoded structure
	pretty, _ := json.MarshalIndent(v, "", "  ")
	logger.Info.Printf("[HANDLER] Decoded request: %s", string(pretty))
	
	return nil
}
