#!/bin/bash

exec 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$(cd "$BACKEND_DIR/../FrontEnd" && pwd)"

export NEXT_TELEMETRY_DISABLED=1

echo "Installing FrontEnd dependencies..."
(cd "$FRONTEND_DIR" && bun install)

echo "Installing BackEnd dependencies..."
(cd "$BACKEND_DIR" && bun install)

echo "Building FrontEnd..."
(cd "$FRONTEND_DIR" && bun run build)

echo "Syncing BackEnd database schema..."
(cd "$BACKEND_DIR" && bun run db:push)

if [ -d "$BACKEND_DIR/mini-services" ]; then
  echo "Installing mini-service dependencies..."
  sh "$SCRIPT_DIR/mini-services-install.sh"

  echo "Building mini-services..."
  sh "$SCRIPT_DIR/mini-services-build.sh"
fi

echo "Build completed."
