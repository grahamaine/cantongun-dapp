#!/usr/bin/env bash
# Build the CantonGun model and start a privacy-aware local ledger + JSON API.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building Daml model"
daml build

echo "==> Starting Canton sandbox + JSON Ledger API (Ctrl-C to stop)"
# `daml start` runs a single-participant Canton sandbox, uploads the DAR, and
# exposes the JSON Ledger API the frontend talks to (http://localhost:7575).
daml start --json-api-port 7575
