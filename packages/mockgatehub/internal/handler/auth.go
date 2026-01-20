package handler

import (
	"net/http"

	"mockgatehub/internal/consts"
	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"
	"mockgatehub/internal/utils"
)

// CreateToken generates an access token (stub - always succeeds)
func (h *Handler) CreateToken(w http.ResponseWriter, r *http.Request) {
	logger.Info.Println("CreateToken called")

	// In sandbox mode, always return a valid token
	response := models.TokenResponse{
		AccessToken: "mock-access-token-" + consts.TestUser1ID,
		TokenType:   "Bearer",
		ExpiresIn:   3600,
	}

	h.sendJSON(w, http.StatusOK, response)
}

// CreateManagedUser creates a new managed user
func (h *Handler) CreateManagedUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateManagedUserRequest
	if err := h.decodeJSON(r, &req); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" {
		h.sendError(w, http.StatusBadRequest, "Email is required")
		return
	}

	logger.Info.Printf("Creating managed user: %s", req.Email)

	// Check if user already exists
	existing, _ := h.store.GetUserByEmail(req.Email)
	if existing != nil {
		logger.Info.Printf("User already exists: %s", req.Email)
		h.sendJSON(w, http.StatusOK, *existing)
		return
	}

	// Create new user
	user := &models.User{
		ID:        utils.GenerateUUID(),
		Email:     req.Email,
		Activated: true,
		Managed:   true,
		Role:      "user",
		Features:  []string{"wallet"},
		KYCState:  "", // Not verified yet
		RiskLevel: "",
	}

	if err := h.store.CreateUser(user); err != nil {
		logger.Error.Printf("Failed to create user: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	logger.Info.Printf("Created user: %s (ID: %s)", user.Email, user.ID)
	h.sendJSON(w, http.StatusCreated, *user)
}

// GetManagedUser retrieves a managed user by email
func (h *Handler) GetManagedUser(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		h.sendError(w, http.StatusBadRequest, "Email parameter is required")
		return
	}

	logger.Info.Printf("Getting managed user: %s", email)

	user, err := h.store.GetUserByEmail(email)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	h.sendJSON(w, http.StatusOK, models.GetManagedUserResponse{User: *user})
}

// UpdateManagedUserEmail updates a user's email address
func (h *Handler) UpdateManagedUserEmail(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateEmailRequest
	if err := h.decodeJSON(r, &req); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.NewEmail == "" {
		h.sendError(w, http.StatusBadRequest, "Both email and new_email are required")
		return
	}

	logger.Info.Printf("Updating user email: %s -> %s", req.Email, req.NewEmail)

	user, err := h.store.GetUserByEmail(req.Email)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	user.Email = req.NewEmail
	if err := h.store.UpdateUser(user); err != nil {
		logger.Error.Printf("Failed to update user: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	logger.Info.Printf("Updated user email: %s", user.ID)
	h.sendJSON(w, http.StatusOK, models.GetManagedUserResponse{User: *user})
}
