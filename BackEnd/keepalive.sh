#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../FrontEnd" && pwd)"

cd "$FRONTEND_DIR"
while true; do
  echo "[$(date)] Starting FrontEnd..."
  bun run dev >> "$FRONTEND_DIR/dev.log" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] FrontEnd exited with code $EXIT_CODE. Restarting in 3s..."
  sleep 3
done
