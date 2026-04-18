#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$BACKEND_DIR/mini-services"

success_count=0
fail_count=0

for dir in "$ROOT_DIR"/*; do
  if [ ! -d "$dir" ] || [ ! -f "$dir/package.json" ]; then
    continue
  fi

  project_name=$(basename "$dir")
  echo "Installing dependencies for $project_name..."

  if (cd "$dir" && bun install); then
    success_count=$((success_count + 1))
  else
    fail_count=$((fail_count + 1))
  fi
done

echo "Mini-services install finished. Success: $success_count, Failed: $fail_count"
