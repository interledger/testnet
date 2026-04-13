#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/local/docker-compose.yml"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <package-filter> <services-csv> [command] [args...]" >&2
  echo "Example: $0 @wallet/frontend wallet-frontend,wallet-backend dev" >&2
  exit 1
fi

PACKAGE_FILTER="$1"
SERVICES_CSV="$2"
shift 2

IFS=',' read -r -a SERVICES <<<"$SERVICES_CSV"

# Only stop compose services on the host; inside containers this would stop the
# service itself and cause restart loops.
if [[ ! -f "/.dockerenv" ]]; then
  # Free host ports used by local package commands without taking down infra services.
  docker compose -f "$COMPOSE_FILE" stop "${SERVICES[@]}" >/dev/null 2>&1 || true
fi

if [[ $# -eq 0 ]]; then
  set -- dev
fi

exec pnpm --filter "$PACKAGE_FILTER" -- "$@"
