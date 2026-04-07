#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js..."
  npx next dev -p 3000
  echo "[$(date)] Server exited. Restarting in 2s..."
  sleep 2
done
