#!/usr/bin/env bash
# Build the CantonGun model and start a privacy-aware local ledger + JSON API.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building Daml model"
daml build

echo "==> Starting sandbox + JSON API (Ctrl-C to stop)"
# `daml start` runs the sandbox ledger, uploads the DAR, and exposes the JSON API
# the frontend talks to (default http://localhost:7575).
daml start \
  --json-api-option --allow-insecure-tokens \
  --open-browser no
