#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../FrontEnd" && pwd)"

cd "$FRONTEND_DIR"
while true; do
  echo "Starting Next.js dev server..."
  npx next dev -p 3000
  echo "Server died, restarting in 3 seconds..."
  sleep 3
done
