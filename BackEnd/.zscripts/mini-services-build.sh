#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$BACKEND_DIR/mini-services"
DIST_DIR="$BACKEND_DIR/mini-services-dist"

mkdir -p "$DIST_DIR"

success_count=0
fail_count=0

for dir in "$ROOT_DIR"/*; do
  if [ ! -d "$dir" ] || [ ! -f "$dir/package.json" ]; then
    continue
  fi

  project_name=$(basename "$dir")
  entry_path=""

  for entry in "src/index.ts" "index.ts" "src/index.js" "index.js"; do
    if [ -f "$dir/$entry" ]; then
      entry_path="$dir/$entry"
      break
    fi
  done

  if [ -z "$entry_path" ]; then
    echo "Skipping $project_name: no entry file found"
    continue
  fi

  output_file="$DIST_DIR/mini-service-$project_name.js"
  if bun build "$entry_path" --outfile "$output_file" --target bun --minify; then
    success_count=$((success_count + 1))
    echo "Built $project_name -> $output_file"
  else
    fail_count=$((fail_count + 1))
    echo "Failed to build $project_name"
  fi
done

if [ -f "$SCRIPT_DIR/mini-services-start.sh" ]; then
  cp "$SCRIPT_DIR/mini-services-start.sh" "$DIST_DIR/mini-services-start.sh"
  chmod +x "$DIST_DIR/mini-services-start.sh"
fi

echo "Mini-services build finished. Success: $success_count, Failed: $fail_count"
