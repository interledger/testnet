#!/bin/bash
# Run MockGatehub integration tests using Go

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Build the test binary
echo "Building test binary..."
go build -o testscript testscript.go

# Run the tests
./testscript

# Exit with the test exit code
exit $?
