#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../FrontEnd" && pwd)"

cd "$FRONTEND_DIR"
while true; do
  echo "[$(date)] Starting Next.js..."
  npx next dev -p 3000
  echo "[$(date)] FrontEnd exited. Restarting in 2s..."
  sleep 2
done
