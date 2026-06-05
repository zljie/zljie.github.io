#!/bin/bash
set -e

# Chat backend endpoint (used by VitePress config to inject into window.__CHAT_CONFIG__)
export CHAT_ENDPOINT="http://localhost:8000/chat"

pnpm docs:dev
