package handler

import (
	"net/http"

	"mockgatehub/internal/consts"
	"mockgatehub/internal/logger"
	"mockgatehub/internal/models"
)

// GetCurrentRates returns exchange rates for all supported currencies
func (h *Handler) GetCurrentRates(w http.ResponseWriter, r *http.Request) {
	logger.Info.Println("Getting current exchange rates")

	// Get counter currency from query param (default USD)
	counter := r.URL.Query().Get("counter")
	if counter == "" {
		counter = "USD"
	}

	// Build response in GateHub format: flat object with counter and currency rates
	response := map[string]interface{}{
		"counter": counter,
	}

	// Add rate for each currency
	for currency, rate := range consts.SandboxRates {
		response[currency] = map[string]interface{}{
			"type":   "ExchangeRate",
			"rate":   rate,
			"amount": "1",
			"change": "0",
		}
	}

	h.sendJSON(w, http.StatusOK, response)
}

// GetVaults returns liquidity vault UUIDs for all currencies
func (h *Handler) GetVaults(w http.ResponseWriter, r *http.Request) {
	logger.Info.Println("Getting liquidity vaults")

	var vaults []models.VaultItem
	for currency, uuid := range consts.SandboxVaultIDs {
		vaults = append(vaults, models.VaultItem{
			Currency: currency,
			UUID:     uuid,
		})
	}

	response := models.GetVaultsResponse{
		Vaults: vaults,
	}

	h.sendJSON(w, http.StatusOK, response)
}
