package handler

import (
	"fmt"
	"net/http"

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

	h.sendJSON(w, http.StatusOK, user)
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

	// Auto-approve KYC in sandbox mode
	user.KYCState = consts.KYCStateAccepted
	user.RiskLevel = consts.RiskLevelLow
	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user KYC state: %v", err)
	}

	// Send webhook asynchronously
	go h.webhookManager.SendAsync(consts.WebhookEventKYCAccepted, userID, map[string]interface{}{
		"message": "User verification accepted",
	})

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
func (h *Handler) KYCIframe(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	userID := r.URL.Query().Get("user_id")

	logger.Info.Printf("Serving KYC iframe: token=%s, user_id=%s", token, userID)

	// Serve simple HTML form
	html := `<!DOCTYPE html>
<html>
<head>
    <title>KYC Verification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .success { color: green; margin-top: 20px; }
    </style>
</head>
<body>
    <h2>KYC Verification - MockGatehub</h2>
    <p>This is a mock KYC verification form. In sandbox mode, all submissions are automatically approved.</p>
    <form id="kycForm">
        <div class="form-group">
            <label>First Name:</label>
            <input type="text" name="first_name" required>
        </div>
        <div class="form-group">
            <label>Last Name:</label>
            <input type="text" name="last_name" required>
        </div>
        <div class="form-group">
            <label>Date of Birth:</label>
            <input type="date" name="dob" required>
        </div>
        <div class="form-group">
            <label>Address:</label>
            <input type="text" name="address" required>
        </div>
        <div class="form-group">
            <label>City:</label>
            <input type="text" name="city" required>
        </div>
        <div class="form-group">
            <label>Country:</label>
            <input type="text" name="country" required>
        </div>
        <button type="submit">Submit for Verification</button>
    </form>
    <div id="result"></div>
    <script>
        document.getElementById('kycForm').addEventListener('submit', function(e) {
            e.preventDefault();
            var result = document.getElementById('result');
            result.innerHTML = '<p class="success">✓ KYC verification submitted and automatically approved!</p>';
            setTimeout(function() {
                window.parent.postMessage({type: 'kyc_complete', status: 'accepted'}, '*');
            }, 1000);
        });
    </script>
</body>
</html>`

	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(html))
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

	// Auto-approve in sandbox mode
	user.KYCState = consts.KYCStateAccepted
	user.RiskLevel = consts.RiskLevelLow

	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	// Send webhook
	go h.webhookManager.SendAsync(consts.WebhookEventKYCAccepted, userID, map[string]interface{}{
		"message": "User verification accepted",
	})

	h.sendJSON(w, http.StatusOK, map[string]string{
		"status":  "accepted",
		"message": "KYC verification completed successfully",
	})
}
