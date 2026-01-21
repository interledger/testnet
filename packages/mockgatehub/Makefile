.PHONY: help test unit-tests testenv-tests coverage build lint clean

help:
	@echo "MockGatehub Test Commands"
	@echo ""
	@echo "test              Run all tests (unit tests + testenv tests)"
	@echo "unit-tests        Run unit tests only"
	@echo "testenv-tests     Run testenv integration tests (requires docker-compose)"
	@echo "coverage          Run unit tests with coverage report"
	@echo "build             Build the mockgatehub binary"
	@echo "lint              Run linter (gofmt, go vet)"
	@echo "clean             Clean up build artifacts and test binaries"
	@echo ""

# Run all tests: unit tests + testenv tests
test: unit-tests testenv-tests
	@echo ""
	@echo "✅ All tests completed"

# Run unit tests
unit-tests:
	@echo "Running unit tests..."
	@go test -v ./... -cover

# Run testenv integration tests
testenv-tests:
	@echo "Running testenv integration tests..."
	@cd testenv && bash run-tests.sh

# Run tests with coverage report
coverage:
	@echo "Running unit tests with coverage..."
	@go test -v ./... -coverprofile=coverage.out
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Build the mockgatehub binary
build:
	@echo "Building mockgatehub..."
	@go build -v -o mockgatehub ./cmd/mockgatehub

# Run linter
lint:
	@echo "Running linters..."
	@gofmt -l .
	@go vet ./...

# Clean up artifacts
clean:
	@echo "Cleaning up..."
	@rm -f mockgatehub coverage.out coverage.html
	@cd testenv && rm -f testscript
	@go clean -testcache
	@echo "Clean complete"
