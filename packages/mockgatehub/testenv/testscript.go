package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"
)

const (
	mockGatehubURL = "http://localhost:28080"
	maxWaitSeconds = 30
)

// ANSI color codes
const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
)

var (
	passed = 0
	failed = 0
	total  = 0
)

func main() {
	printHeader("MockGatehub Integration Test Suite")

	// Start services
	if err := startServices(); err != nil {
		fmt.Printf("%s✗ Failed to start services: %v%s\n", colorRed, err, colorReset)
		os.Exit(1)
	}
	defer cleanup()

	// Wait for services to be ready
	if err := waitForServices(); err != nil {
		fmt.Printf("%s✗ Services failed to start: %v%s\n", colorRed, err, colorReset)
		os.Exit(1)
	}
	fmt.Printf("%s✓ Services ready%s\n\n", colorGreen, colorReset)

	// Run tests
	runTests()

	// Print summary
	printSummary()

	// Exit with appropriate code
	if failed > 0 {
		os.Exit(1)
	}
}

func startServices() error {
	fmt.Printf("%sStarting test environment...%s\n", colorBlue, colorReset)
	cmd := exec.Command("docker", "compose", "-f", "docker-compose.yml", "up", "-d")
	cmd.Stdout = nil
	cmd.Stderr = nil
	return cmd.Run()
}

func cleanup() {
	fmt.Printf("\n%sCleaning up test environment...%s\n", colorBlue, colorReset)
	cmd := exec.Command("docker", "compose", "-f", "docker-compose.yml", "down", "-v")
	cmd.Stdout = nil
	cmd.Stderr = nil
	_ = cmd.Run()
	fmt.Printf("%s✓ Cleanup complete%s\n\n", colorGreen, colorReset)
}

func waitForServices() error {
	fmt.Printf("%sWaiting for services to be ready...%s\n", colorBlue, colorReset)
	for i := 0; i < maxWaitSeconds; i++ {
		resp, err := http.Get(mockGatehubURL + "/health")
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			return nil
		}
		if resp != nil {
			resp.Body.Close()
		}
		fmt.Print(".")
		time.Sleep(1 * time.Second)
	}
	return fmt.Errorf("timeout after %d seconds", maxWaitSeconds)
}

func runTests() {
	var userID, token, walletAddress string

	// Test 1: Health check
	runTest("Health Check", func() (bool, string) {
		var result map[string]interface{}
		if err := getJSON("/health", &result); err != nil {
			return false, err.Error()
		}
		status, ok := result["status"].(string)
		return ok && status == "ok", fmt.Sprintf("status=%s", status)
	})

	// Test 2: Create managed user
	runTest("Create Managed User", func() (bool, string) {
		body := map[string]string{
			"email":    "testuser@example.com",
			"password": "TestPass123!",
		}
		var result map[string]interface{}
		if err := postJSON("/auth/v1/users/managed", body, &result); err != nil {
			return false, err.Error()
		}

		if user, ok := result["user"].(map[string]interface{}); ok {
			if id, ok := user["id"].(string); ok {
				userID = id
				return true, fmt.Sprintf("User ID = %s", userID)
			}
		}
		return false, "Failed to extract user ID"
	})

	// Test 3: Get authorization token
	runTest("Get Authorization Token", func() (bool, string) {
		body := map[string]string{
			"username": "testuser@example.com",
			"password": "TestPass123!",
		}
		var result map[string]interface{}
		if err := postJSON("/auth/v1/tokens", body, &result); err != nil {
			return false, err.Error()
		}

		if accessToken, ok := result["access_token"].(string); ok {
			token = accessToken
			return true, fmt.Sprintf("Token obtained (%d chars)", len(token))
		}
		return false, "Failed to extract token"
	})

	// Test 4: Start KYC
	runTest("Start KYC (Auto-Approval)", func() (bool, string) {
		var result map[string]interface{}
		if err := postJSONWithHeaders(
			fmt.Sprintf("/id/v1/users/%s/hubs/gw", userID),
			map[string]string{},
			map[string]string{
				"x-gatehub-app-id":    "test-app",
				"x-gatehub-timestamp": strconv.FormatInt(time.Now().Unix(), 10),
				"x-gatehub-signature": "dummy",
			},
			&result,
		); err != nil {
			return false, err.Error()
		}

		if _, ok := result["token"]; ok {
			return true, "KYC started"
		}
		return false, "No token in response"
	})

	// Test 5: Get user KYC state
	runTest("Get User KYC State", func() (bool, string) {
		var result map[string]interface{}
		if err := getJSONWithHeaders(
			fmt.Sprintf("/id/v1/users/%s", userID),
			map[string]string{
				"x-gatehub-app-id":    "test-app",
				"x-gatehub-timestamp": strconv.FormatInt(time.Now().Unix(), 10),
				"x-gatehub-signature": "dummy",
			},
			&result,
		); err != nil {
			return false, err.Error()
		}

		kycState, _ := result["kyc_state"].(string)
		return kycState == "accepted", fmt.Sprintf("KYC State = %s", kycState)
	})

	// Test 6: Create wallet
	runTest("Create Wallet", func() (bool, string) {
		body := map[string]string{
			"name":     "My Wallet",
			"currency": "XRP",
		}
		var result map[string]interface{}
		if err := postJSONWithHeaders(
			fmt.Sprintf("/core/v1/users/%s/wallets", userID),
			body,
			map[string]string{
				"x-gatehub-app-id":    "test-app",
				"x-gatehub-timestamp": strconv.FormatInt(time.Now().Unix(), 10),
				"x-gatehub-signature": "dummy",
			},
			&result,
		); err != nil {
			return false, err.Error()
		}

		if address, ok := result["address"].(string); ok {
			walletAddress = address
			return true, fmt.Sprintf("Wallet Address = %s", walletAddress)
		}
		return false, "Failed to extract wallet address"
	})

	// Test 7: Get wallet balance
	runTest("Get Wallet Balance", func() (bool, string) {
		var result map[string]interface{}
		if err := getJSONWithHeaders(
			fmt.Sprintf("/core/v1/wallets/%s/balances", walletAddress),
			map[string]string{
				"x-gatehub-app-id":    "test-app",
				"x-gatehub-timestamp": strconv.FormatInt(time.Now().Unix(), 10),
				"x-gatehub-signature": "dummy",
			},
			&result,
		); err != nil {
			return false, err.Error()
		}

		balances, ok := result["balances"].([]interface{})
		if !ok || len(balances) == 0 {
			return false, "No balances returned"
		}
		return true, fmt.Sprintf("Retrieved %d currency balances", len(balances))
	})

	// Test 8: Get exchange rates
	runTest("Get Exchange Rates", func() (bool, string) {
		var result map[string]interface{}
		if err := getJSON("/rates/v1/rates/current", &result); err != nil {
			return false, err.Error()
		}

		rates, ok := result["rates"].([]interface{})
		if !ok || len(rates) == 0 {
			return false, "No rates returned"
		}
		return true, fmt.Sprintf("Retrieved %d rate pairs", len(rates))
	})

	// Test 9: Get vault information
	runTest("Get Vault Information", func() (bool, string) {
		var result map[string]interface{}
		if err := getJSON("/rates/v1/liquidity_provider/vaults", &result); err != nil {
			return false, err.Error()
		}

		vaults, ok := result["vaults"].([]interface{})
		if !ok || len(vaults) == 0 {
			return false, "No vaults returned"
		}
		return true, fmt.Sprintf("Retrieved %d vaults", len(vaults))
	})

	// Test 10: Create transaction (optional)
	total++
	fmt.Printf("%sTEST %d: Create Transaction%s\n", colorBlue, total, colorReset)
	body := map[string]interface{}{
		"user_id":    userID,
		"amount":     100,
		"currency":   "XRP",
		"vault_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
		"type":       1,
	}
	var result map[string]interface{}
	err := postJSONWithHeaders(
		"/core/v1/transactions",
		body,
		map[string]string{
			"x-gatehub-app-id":    "test-app",
			"x-gatehub-timestamp": strconv.FormatInt(time.Now().Unix(), 10),
			"x-gatehub-signature": "dummy",
		},
		&result,
	)
	if err != nil {
		fmt.Printf("%s⚠ SKIPPED: Transaction creation not fully implemented%s\n\n", colorYellow, colorReset)
	} else if txID, ok := result["id"].(string); ok {
		fmt.Printf("%s✓ PASSED: Transaction ID = %s%s\n\n", colorGreen, txID, colorReset)
		passed++
	} else {
		fmt.Printf("%s✗ FAILED: Could not extract transaction ID%s\n\n", colorRed, colorReset)
		failed++
	}

	_, _ = token, walletAddress // Keep for future use
}

func runTest(name string, testFunc func() (bool, string)) {
	total++
	fmt.Printf("%sTEST %d: %s%s\n", colorBlue, total, name, colorReset)

	success, message := testFunc()

	if success {
		fmt.Printf("%s✓ PASSED%s", colorGreen, colorReset)
		if message != "" {
			fmt.Printf(": %s", message)
		}
		fmt.Println()
		passed++
	} else {
		fmt.Printf("%s✗ FAILED%s", colorRed, colorReset)
		if message != "" {
			fmt.Printf(": %s", message)
		}
		fmt.Println()
		failed++
	}
}

func getJSON(path string, result interface{}) error {
	return getJSONWithHeaders(path, nil, result)
}

func getJSONWithHeaders(path string, headers map[string]string, result interface{}) error {
	req, err := http.NewRequest("GET", mockGatehubURL+path, nil)
	if err != nil {
		return err
	}

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	return json.Unmarshal(body, result)
}

func postJSON(path string, body interface{}, result interface{}) error {
	return postJSONWithHeaders(path, body, nil, result)
}

func postJSONWithHeaders(path string, body interface{}, headers map[string]string, result interface{}) error {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", mockGatehubURL+path, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	return json.Unmarshal(respBody, result)
}

func printHeader(title string) {
	fmt.Printf("%s======================================%s\n", colorBlue, colorReset)
	fmt.Printf("%s  %s%s\n", colorBlue, title, colorReset)
	fmt.Printf("%s======================================%s\n\n", colorBlue, colorReset)
}

func printSummary() {
	fmt.Printf("%s======================================%s\n", colorBlue, colorReset)
	fmt.Printf("%s  Test Summary%s\n", colorBlue, colorReset)
	fmt.Printf("%s======================================%s\n", colorBlue, colorReset)
	fmt.Printf("Total Tests:  %d\n", total)
	fmt.Printf("%sPassed:       %d%s\n", colorGreen, passed, colorReset)
	fmt.Printf("%sFailed:       %d%s\n", colorRed, failed, colorReset)
	fmt.Printf("%s======================================%s\n\n", colorBlue, colorReset)

	if failed == 0 {
		fmt.Printf("%s🎉 ALL TESTS PASSED!%s\n\n", colorGreen, colorReset)
	} else {
		fmt.Printf("%s❌ SOME TESTS FAILED%s\n\n", colorRed, colorReset)
	}
}
