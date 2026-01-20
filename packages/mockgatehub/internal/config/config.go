package config

import (
	"os"
	"strconv"
)

// Config holds application configuration
type Config struct {
	Port          string
	RedisURL      string
	RedisDB       int
	WebhookURL    string
	WebhookSecret string
	UseRedis      bool
}

// Load reads configuration from environment variables
func Load() *Config {
	cfg := &Config{
		Port:          getEnv("MOCKGATEHUB_PORT", "8080"),
		RedisURL:      getEnv("MOCKGATEHUB_REDIS_URL", ""),
		RedisDB:       getEnvInt("MOCKGATEHUB_REDIS_DB", 0),
		WebhookURL:    getEnv("WEBHOOK_URL", ""),
		WebhookSecret: getEnv("WEBHOOK_SECRET", "mock-secret"),
	}

	// Use Redis if URL is provided
	cfg.UseRedis = cfg.RedisURL != ""

	return cfg
}

// getEnv gets environment variable with fallback
func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// getEnvInt gets integer environment variable with fallback
func getEnvInt(key string, defaultVal int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}
