#!/bin/bash
# Government Sahayak Unified Runner
# Starts both Backend and Frontend in the same network namespace

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "Starting Government Sahayak Services..."

# 1. Start Backend
export PYTHONPATH=.
"$DIR/.venv/bin/python" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

# Wait for backend to be ready
sleep 2

# 2. Start Frontend
cd "$DIR/helpdesk-web"
exec npm run dev -- --host 127.0.0.1 --port 3000
