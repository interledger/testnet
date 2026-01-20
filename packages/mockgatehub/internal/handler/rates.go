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

	var rates []models.RateItem
	for currency, rate := range consts.SandboxRates {
		rates = append(rates, models.RateItem{
			Currency: currency,
			Rate:     rate,
		})
	}

	response := models.GetRatesResponse{
		Rates: rates,
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
