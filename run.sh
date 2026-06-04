#!/bin/bash

# Agent Chatbot UI - Development Script
# Usage:
#   ./run.sh                     # Uses default /chat
#   ./run.sh --endpoint http://localhost:8000/chat
#   VITE_CHAT_ENDPOINT=http://localhost:8000/chat ./run.sh

set -e

ENDPOINT="${VITE_CHAT_ENDPOINT:-/chat}"

# Parse --endpoint argument
while [[ $# -gt 0 ]]; do
  case $1 in
    --endpoint)
      ENDPOINT="$2"
      shift 2
      ;;
    -e)
      ENDPOINT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: ./run.sh [--endpoint <url>]"
      echo "  --endpoint, -e  Set the Agent backend endpoint (default: /chat)"
      echo "  Also respects VITE_CHAT_ENDPOINT env var."
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./run.sh [--endpoint <url>]"
      exit 1
      ;;
  esac
done

echo "🚀 Starting Agent Chatbot UI server..."
echo "📡 Chat endpoint: $ENDPOINT"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first: npm install -g pnpm"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start dev server with the configured endpoint
echo "🔥 Server starting at http://localhost:5174"
VITE_CHAT_ENDPOINT="$ENDPOINT" pnpm dev
