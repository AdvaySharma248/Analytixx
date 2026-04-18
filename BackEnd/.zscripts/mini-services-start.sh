#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$BACKEND_DIR/mini-services-dist"
pids=""

cleanup() {
  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT INT TERM

if [ ! -d "$DIST_DIR" ]; then
  echo "Mini-services dist directory not found, skipping..."
  exit 0
fi

for file in "$DIST_DIR"/mini-service-*.js; do
  if [ ! -f "$file" ]; then
    continue
  fi

  bun "$file" &
  pid=$!
  pids="$pids $pid"
  echo "Started $(basename "$file") (PID: $pid)"
done

wait
