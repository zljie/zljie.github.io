#!/bin/bash
set -e

# Chat backend endpoint (used by Vite client-side code via VITE_CHAT_ENDPOINT)
export VITE_CHAT_ENDPOINT="http://localhost:8000/chat"

pnpm docs:dev
