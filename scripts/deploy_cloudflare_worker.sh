#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "CLOUDFLARE_API_TOKEN is not set."
  echo
  echo "Set it for this shell, then rerun:"
  echo "  export CLOUDFLARE_API_TOKEN=your_token_here"
  echo "  npm run deploy:cf"
  exit 1
fi

echo "[1/2] Building Cloudflare bundle..."
python3 scripts/build_cloudflare_pages_bundle.py

echo "[2/2] Deploying Worker with Wrangler..."
npx wrangler deploy
