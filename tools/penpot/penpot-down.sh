#!/usr/bin/env bash
# Stop the local self-hosted Penpot started by penpot-up.sh.
#
#   tools/penpot/penpot-down.sh           stop (keep data volumes)
#   tools/penpot/penpot-down.sh --wipe    stop AND drop all Penpot data (-v)
#
# Env: PENPOT_PROJECT (default: penpot)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$HERE/.run/docker-compose.yaml"
PROJECT="${PENPOT_PROJECT:-penpot}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Nothing to stop: $COMPOSE_FILE not found (was penpot-up.sh ever run?)." >&2
  exit 0
fi

if [[ "${1:-}" == "--wipe" ]]; then
  echo "Stopping Penpot and DROPPING all data volumes…"
  docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down -v
else
  echo "Stopping Penpot (data volumes preserved)…"
  docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down
fi
