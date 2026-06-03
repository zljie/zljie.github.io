#!/bin/bash
set -e

export CHAT_ENDPOINT="http://localhost:8000/chat"

pnpm docs:dev
