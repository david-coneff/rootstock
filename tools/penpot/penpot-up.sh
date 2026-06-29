#!/usr/bin/env bash
# Stand up a local self-hosted Penpot for rootstock component testing.
#
# Thin wrapper over Penpot's OFFICIAL docker-compose: we download their real
# stack (never vendor a copy that would drift) into a git-ignored .run/ dir and
# bring it up. See ../../docs/PENPOT_SELFHOST.md.
#
#   tools/penpot/penpot-up.sh           start (downloads compose on first run)
#   tools/penpot/penpot-up.sh --pull    re-download the compose, then start
#
# Env overrides:
#   PENPOT_COMPOSE_REF   git ref/tag of penpot/penpot to fetch (default: main).
#                        Pin to a tag for reproducibility, e.g. PENPOT_COMPOSE_REF=2.16.0
#   PENPOT_PROJECT       docker compose project name (default: penpot)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$HERE/.run"
REF="${PENPOT_COMPOSE_REF:-main}"
PROJECT="${PENPOT_PROJECT:-penpot}"
COMPOSE_URL="https://raw.githubusercontent.com/penpot/penpot/${REF}/docker/images/docker-compose.yaml"
COMPOSE_FILE="$RUN_DIR/docker-compose.yaml"

mkdir -p "$RUN_DIR"

if [[ "${1:-}" == "--pull" || ! -f "$COMPOSE_FILE" ]]; then
  echo "Fetching Penpot compose @ ${REF} → $COMPOSE_FILE"
  curl -fsSL -o "$COMPOSE_FILE" "$COMPOSE_URL"
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "error: Docker Compose v2 is required (docker compose version)." >&2
  exit 1
fi

echo "Starting Penpot (project: $PROJECT)…"
docker compose -p "$PROJECT" -f "$COMPOSE_FILE" up -d

cat <<'EOF'

Penpot is starting. Give it a minute on first run (it pulls images + migrates the DB).
  Web UI:       http://localhost:9001
  Mailcatcher:  http://localhost:1080   (sign-up / reset mail)

No "Create account" on the login page? See docs/PENPOT_SELFHOST.md §3
(add enable-registration to PENPOT_FLAGS in .run/docker-compose.yaml, then:
  docker compose -p penpot -f tools/penpot/.run/docker-compose.yaml restart penpot-backend penpot-frontend)

Stop with: tools/penpot/penpot-down.sh
EOF
