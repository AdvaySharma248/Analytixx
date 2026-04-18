#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$(cd "$BACKEND_DIR/../FrontEnd" && pwd)"
pids=""

wait_for_service() {
  host="$1"
  port="$2"
  service_name="$3"
  max_attempts="${4:-60}"
  attempt=1

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

cleanup() {
  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT INT TERM

(
  cd "$BACKEND_DIR"
  exec bun run start
) &
BACKEND_PID=$!
pids="$BACKEND_PID"

(
  cd "$FRONTEND_DIR"
  exec bun run start
) &
FRONTEND_PID=$!
pids="$pids $FRONTEND_PID"

wait_for_service "localhost" "4000" "BackEnd API"
wait_for_service "localhost" "3000" "FrontEnd app"

if [ -f "$SCRIPT_DIR/mini-services-start.sh" ]; then
  sh "$SCRIPT_DIR/mini-services-start.sh" &
  MINI_PID=$!
  pids="$pids $MINI_PID"
fi

caddy run --config "$BACKEND_DIR/Caddyfile" --adapter caddyfile &
CADDY_PID=$!
pids="$pids $CADDY_PID"

wait
