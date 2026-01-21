package handler

import (
	"fmt"
	"html/template"
	"net/http"
	"os"

	"mockgatehub/internal/consts"
	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"

	"github.com/go-chi/chi/v5"
)

// GetUser retrieves user information including KYC state
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		h.sendError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	logger.Info.Printf("Getting user: %s", userID)

	user, err := h.store.GetUser(userID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	// Build response with verifications array matching production GateHub API
	response := map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"activated":  user.Activated,
		"managed":    user.Managed,
		"role":       user.Role,
		"features":   user.Features,
		"kyc_state":  user.KYCState,
		"risk_level": user.RiskLevel,
		"created_at": user.CreatedAt,
		"profile": map[string]string{
			"first_name":           "",
			"last_name":            "",
			"address_country_code": "",
			"address_city":         "",
			"address_street1":      "",
			"address_street2":      "",
		},
		"verifications": []map[string]interface{}{
			{
				"uuid":          "mock-verification-uuid",
				"status":        1, // 1 = verified
				"state":         1,
				"provider_type": "sumsub",
			},
		},
	}

	h.sendJSON(w, http.StatusOK, response)
}

// StartKYC initiates the KYC verification process
func (h *Handler) StartKYC(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	gatewayID := chi.URLParam(r, "gatewayID")

	if userID == "" || gatewayID == "" {
		h.sendError(w, http.StatusBadRequest, "User ID and Gateway ID are required")
		return
	}

	logger.Info.Printf("Starting KYC for user: %s, gateway: %s", userID, gatewayID)

	user, err := h.store.GetUser(userID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	// Generate a token for the iframe
	token := fmt.Sprintf("kyc-token-%s-%s", userID, gatewayID)
	iframeURL := fmt.Sprintf("/iframe/onboarding?token=%s&user_id=%s", token, userID)

	logger.Info.Printf("KYC iframe URL: %s", iframeURL)

	// Move user into action_required so KYC must be completed via iframe submission
	user.KYCState = consts.KYCStateActionRequired
	user.RiskLevel = consts.RiskLevelLow
	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user KYC state: %v", err)
	}

	response := models.StartKYCResponse{
		IframeURL: iframeURL,
		Token:     token,
	}

	h.sendJSON(w, http.StatusOK, response)
}

// UpdateKYCState updates the KYC verification state for a user
func (h *Handler) UpdateKYCState(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	gatewayID := chi.URLParam(r, "gatewayID")

	if userID == "" || gatewayID == "" {
		h.sendError(w, http.StatusBadRequest, "User ID and Gateway ID are required")
		return
	}

	var req models.UpdateKYCStateRequest
	if err := h.decodeJSON(r, &req); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	logger.Info.Printf("Updating KYC state for user %s: state=%s, risk=%s", userID, req.State, req.RiskLevel)

	user, err := h.store.GetUser(userID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	user.KYCState = req.State
	user.RiskLevel = req.RiskLevel

	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	// Send appropriate webhook
	var eventType string
	switch req.State {
	case consts.KYCStateAccepted:
		eventType = consts.WebhookEventKYCAccepted
	case consts.KYCStateRejected:
		eventType = consts.WebhookEventKYCRejected
	case consts.KYCStateActionRequired:
		eventType = consts.WebhookEventKYCActionRequired
	}

	if eventType != "" {
		go h.webhookManager.SendAsync(eventType, userID, map[string]interface{}{
			"state":      req.State,
			"risk_level": req.RiskLevel,
		})
	}

	h.sendJSON(w, http.StatusOK, user)
}

// KYCIframe serves the KYC onboarding iframe
// OverrideRiskLevel updates the risk level for a user
func (h *Handler) OverrideRiskLevel(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	gatewayID := chi.URLParam(r, "gatewayID")

	if userID == "" || gatewayID == "" {
		h.sendError(w, http.StatusBadRequest, "User ID and Gateway ID are required")
		return
	}

	var req struct {
		RiskLevel string `json:"risk_level"`
		Reason    string `json:"reason"`
	}
	if err := h.decodeJSON(r, &req); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	logger.Info.Printf("Overriding risk level for user %s: risk=%s, reason=%s", userID, req.RiskLevel, req.Reason)

	user, err := h.store.GetUser(userID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	user.RiskLevel = req.RiskLevel

	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user risk level: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	logger.Info.Printf("Risk level updated successfully for user %s", userID)
	h.sendJSON(w, http.StatusOK, user)
}

// KYCIframe serves the KYC onboarding iframe
func (h *Handler) KYCIframe(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	userID := r.URL.Query().Get("user_id")

	logger.Info.Printf("Serving KYC iframe: token=%s, user_id=%s", token, userID)

	// Try multiple paths to find the template
	possiblePaths := []string{
		"web/kyc-iframe.html",
		"./web/kyc-iframe.html",
		"../web/kyc-iframe.html",
		"../../web/kyc-iframe.html",
	}

	var templatePath string
	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			templatePath = path
			break
		}
	}

	if templatePath == "" {
		logger.Error.Printf("Could not find KYC iframe template in any of: %v", possiblePaths)
		h.sendError(w, http.StatusInternalServerError, "Template not found")
		return
	}

	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		logger.Error.Printf("Failed to parse KYC iframe template: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Template error")
		return
	}

	data := map[string]string{
		"Token":  token,
		"UserID": userID,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := tmpl.Execute(w, data); err != nil {
		logger.Error.Printf("Failed to execute KYC iframe template: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Template execution error")
		return
	}
}

// KYCIframeSubmit handles KYC form submission
func (h *Handler) KYCIframeSubmit(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid form data")
		return
	}

	userID := r.FormValue("user_id")
	if userID == "" {
		h.sendError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	logger.Info.Printf("KYC form submitted for user: %s", userID)

	user, err := h.store.GetUser(userID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	user.KYCState = consts.KYCStateAccepted
	riskLevel := r.FormValue("risk_level")
	if riskLevel == "" {
		riskLevel = consts.RiskLevelLow
	}
	user.RiskLevel = riskLevel

	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	go h.webhookManager.SendAsync(consts.WebhookEventKYCAccepted, userID, map[string]interface{}{
		"message": "User verification accepted",
	})

	h.sendJSON(w, http.StatusOK, map[string]string{
		"status":  consts.KYCStateAccepted,
		"message": "KYC verification completed successfully",
	})
}
