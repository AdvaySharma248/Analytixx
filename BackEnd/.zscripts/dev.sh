#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$(cd "$BACKEND_DIR/../FrontEnd" && pwd)"
BACKEND_LOG="$BACKEND_DIR/.zscripts/backend-dev.log"
FRONTEND_LOG="$BACKEND_DIR/.zscripts/frontend-dev.log"
pids=""

wait_for_service() {
  local host="$1"
  local port="$2"
  local service_name="$3"
  local max_attempts="${4:-60}"
  local attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    if curl -s --connect-timeout 2 --max-time 5 "http://$host:$port" >/dev/null 2>&1; then
      echo "$service_name is ready on $host:$port"
      return 0
    fi

    echo "Waiting for $service_name on $host:$port ($attempt/$max_attempts)..."
    sleep 1
    attempt=$((attempt + 1))
  done

  echo "ERROR: $service_name failed to start on $host:$port"
  return 1
}

start_mini_services() {
  local mini_services_dir="$BACKEND_DIR/mini-services"

  if [ ! -d "$mini_services_dir" ]; then
    echo "Mini-services directory not found, skipping..."
    return 0
  fi

  for service_dir in "$mini_services_dir"/*; do
    if [ ! -d "$service_dir" ] || [ ! -f "$service_dir/package.json" ]; then
      continue
    fi

    service_name=$(basename "$service_dir")

    if ! grep -q '"dev"' "$service_dir/package.json"; then
      echo "[$service_name] No dev script found, skipping..."
      continue
    fi

    (
      cd "$service_dir"
      bun install
      exec bun run dev
    ) >"$BACKEND_DIR/.zscripts/mini-service-${service_name}.log" 2>&1 &

    service_pid=$!
    pids="$pids $service_pid"
    echo "[$service_name] Started (PID: $service_pid)"
  done
}

cleanup() {
  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT INT TERM

echo "Installing BackEnd dependencies..."
(cd "$BACKEND_DIR" && bun install)

echo "Installing FrontEnd dependencies..."
(cd "$FRONTEND_DIR" && bun install)

echo "Syncing BackEnd database schema..."
(cd "$BACKEND_DIR" && bun run db:push)

echo "Starting BackEnd dev server..."
(
  cd "$BACKEND_DIR"
  exec bun run dev
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
pids="$BACKEND_PID"

echo "Starting FrontEnd dev server..."
(
  cd "$FRONTEND_DIR"
  exec bun run dev
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
pids="$pids $FRONTEND_PID"

wait_for_service "localhost" "4000" "BackEnd API"
wait_for_service "localhost" "3000" "FrontEnd app"
start_mini_services

echo "BackEnd log: $BACKEND_LOG"
echo "FrontEnd log: $FRONTEND_LOG"

wait
