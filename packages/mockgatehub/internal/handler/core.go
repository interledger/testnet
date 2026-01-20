package handler

import (
	"fmt"
	"net/http"
	"time"

	"mockgatehub/internal/consts"
	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"
	"mockgatehub/internal/utils"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) CreateWallet(w http.ResponseWriter, r *http.Request) {
	var req models.CreateWalletRequest
	if err := h.decodeJSON(r, &req); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get userID from path parameter if not in body
	userID := chi.URLParam(r, "userID")
	if req.UserID == "" && userID != "" {
		req.UserID = userID
	}

	if req.UserID == "" {
		h.sendError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	logger.Info.Printf("Creating wallet for user: %s", req.UserID)

	_, err := h.store.GetUser(req.UserID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	address := utils.GenerateMockXRPLAddress()

	if req.Type == 0 {
		req.Type = consts.WalletTypeStandard
	}
	if req.Network == 0 {
		req.Network = consts.NetworkXRPLedger
	}

	wallet := &models.Wallet{
		Address: address,
		UserID:  req.UserID,
		Name:    req.Name,
		Type:    req.Type,
		Network: req.Network,
	}

	if err := h.store.CreateWallet(wallet); err != nil {
		logger.Error.Printf("Failed to create wallet: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to create wallet")
		return
	}

	logger.Info.Printf("Created wallet: %s for user %s", address, req.UserID)
	h.sendJSON(w, http.StatusCreated, wallet)
}

// GetUserWallets retrieves all wallets for a user (GET /core/v1/users/{userID})
// If no wallets exist, creates one automatically
func (h *Handler) GetUserWallets(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		h.sendError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	logger.Info.Printf("Getting wallets for user: %s", userID)

	_, err := h.store.GetUser(userID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	wallets, err := h.store.GetWalletsByUser(userID)
	if err != nil {
		logger.Error.Printf("Failed to get user wallets: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to get wallets")
		return
	}

	// If no wallets exist, create one automatically
	if len(wallets) == 0 {
		logger.Info.Printf("No wallets found for user %s, creating one automatically", userID)
		address := utils.GenerateMockXRPLAddress()
		wallet := &models.Wallet{
			Address: address,
			UserID:  userID,
			Name:    "Default Wallet",
			Type:    consts.WalletTypeStandard,
			Network: consts.NetworkXRPLedger,
		}

		if err := h.store.CreateWallet(wallet); err != nil {
			logger.Error.Printf("Failed to create wallet: %v", err)
			h.sendError(w, http.StatusInternalServerError, "Failed to create wallet")
			return
		}

		logger.Info.Printf("Created default wallet %s for user %s", address, userID)
		wallets = append(wallets, wallet)
	}

	// Return in the format expected by wallet-backend: { wallets: [...] }
	response := map[string]interface{}{
		"wallets": []map[string]interface{}{},
	}

	for _, w := range wallets {
		response["wallets"] = append(response["wallets"].([]map[string]interface{}), map[string]interface{}{
			"address": w.Address,
		})
	}

	logger.Info.Printf("Returning %d wallets for user %s", len(wallets), userID)
	h.sendJSON(w, http.StatusOK, response)
}

func (h *Handler) GetWallet(w http.ResponseWriter, r *http.Request) {
	walletID := chi.URLParam(r, "walletID")
	if walletID == "" {
		// Try legacy parameter name
		walletID = chi.URLParam(r, "address")
	}
	if walletID == "" {
		h.sendError(w, http.StatusBadRequest, "Wallet address is required")
		return
	}

	logger.Info.Printf("Getting wallet: %s", walletID)

	wallet, err := h.store.GetWallet(walletID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "Wallet not found")
		return
	}

	h.sendJSON(w, http.StatusOK, wallet)
}

func (h *Handler) GetWalletBalance(w http.ResponseWriter, r *http.Request) {
	walletID := chi.URLParam(r, "walletID")
	logger.Info.Printf("DEBUG: walletID from path = '%s'", walletID)

	if walletID == "" {
		// Try legacy parameter name
		walletID = chi.URLParam(r, "address")
		logger.Info.Printf("DEBUG: walletID from address = '%s'", walletID)
	}
	if walletID == "" {
		h.sendError(w, http.StatusBadRequest, "Wallet address is required")
		return
	}

	logger.Info.Printf("Getting balance for wallet: %s", walletID)

	wallet, err := h.store.GetWallet(walletID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "Wallet not found")
		return
	}

	var balances []map[string]interface{}
	for _, currency := range consts.SandboxCurrencies {
		balance, _ := h.store.GetBalance(wallet.UserID, currency)
		balances = append(balances, map[string]interface{}{
			"available": fmt.Sprintf("%g", balance),
			"pending":   "0",
			"total":     fmt.Sprintf("%g", balance),
			"vault": map[string]interface{}{
				"uuid":       consts.SandboxVaultIDs[currency],
				"name":       fmt.Sprintf("Sandbox Vault %s", currency),
				"asset_code": currency,
				"created_at": time.Now().Format(time.RFC3339),
				"updated_at": time.Now().Format(time.RFC3339),
			},
		})
	}

	logger.Info.Printf("Returning %d currency balances for wallet %s", len(balances), walletID)

	h.sendJSON(w, http.StatusOK, balances)
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTransactionRequest
	if err := h.decodeJSON(r, &req); err != nil {
		h.sendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UserID == "" {
		h.sendError(w, http.StatusBadRequest, "user_id is required")
		return
	}
	if req.Amount <= 0 {
		h.sendError(w, http.StatusBadRequest, "amount must be positive")
		return
	}
	if req.Currency == "" {
		h.sendError(w, http.StatusBadRequest, "currency is required")
		return
	}

	logger.Info.Printf("Creating transaction: user=%s, amount=%.2f %s, type=%d",
		req.UserID, req.Amount, req.Currency, req.Type)

	_, err := h.store.GetUser(req.UserID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "User not found")
		return
	}

	if req.Type == 0 {
		req.Type = consts.TransactionTypeDeposit
	}
	if req.DepositType == "" {
		if req.Type == consts.TransactionTypeDeposit {
			req.DepositType = consts.DepositTypeExternal
		} else {
			req.DepositType = consts.DepositTypeHosted
		}
	}

	tx := &models.Transaction{
		UserID:           req.UserID,
		UID:              req.UID,
		Amount:           req.Amount,
		Currency:         req.Currency,
		VaultUUID:        req.VaultUUID,
		ReceivingAddress: req.ReceivingAddress,
		Type:             req.Type,
		DepositType:      req.DepositType,
		Status:           "completed",
	}

	if err := h.store.CreateTransaction(tx); err != nil {
		logger.Error.Printf("Failed to create transaction: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	if err := h.store.AddBalance(req.UserID, req.Currency, req.Amount); err != nil {
		logger.Error.Printf("Failed to update balance: %v", err)
		h.sendError(w, http.StatusInternalServerError, "Failed to update balance")
		return
	}

	logger.Info.Printf("Created transaction: %s (%.2f %s)", tx.ID, tx.Amount, tx.Currency)

	if req.DepositType == consts.DepositTypeExternal {
		go h.webhookManager.SendAsync(consts.WebhookEventDepositCompleted, req.UserID, map[string]interface{}{
			"transaction_id": tx.ID,
			"amount":         tx.Amount,
			"currency":       tx.Currency,
		})
	}

	h.sendJSON(w, http.StatusCreated, tx)
}

func (h *Handler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	txID := chi.URLParam(r, "txID")
	if txID == "" {
		h.sendError(w, http.StatusBadRequest, "Transaction ID is required")
		return
	}

	logger.Info.Printf("Getting transaction: %s", txID)

	tx, err := h.store.GetTransaction(txID)
	if err != nil {
		h.sendError(w, http.StatusNotFound, "Transaction not found")
		return
	}

	h.sendJSON(w, http.StatusOK, tx)
}
