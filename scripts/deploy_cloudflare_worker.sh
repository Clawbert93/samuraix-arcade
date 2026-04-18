#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/2] Building Cloudflare bundle..."
python3 scripts/build_cloudflare_pages_bundle.py

echo "[2/2] Deploying Worker with Wrangler..."
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Using CLOUDFLARE_API_TOKEN from the current shell."
else
  echo "No CLOUDFLARE_API_TOKEN set, so Wrangler will use your local OAuth login if available."
  echo "If deploy fails with auth, run: npx wrangler login"
fi

npx wrangler deploy
