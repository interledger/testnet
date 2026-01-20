package handler

import (
	"encoding/json"
	"net/http"

	"mockgatehub/internal/models"
)

// Helper methods for JSON responses

func (h *Handler) sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *Handler) sendError(w http.ResponseWriter, status int, message string) {
	h.sendJSON(w, status, models.ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
	})
}

func (h *Handler) decodeJSON(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}
