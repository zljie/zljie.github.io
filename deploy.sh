#!/bin/bash

# Agent Chatbot UI - Deploy Script
# Usage: ./deploy.sh [version]
#   version: Optional. New version number (e.g., patch, minor, major, or x.y.z)
#            If not provided, you'll be prompted to choose.

set -e

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ensure_npm_auth() {
    if [ -z "$NPM_TOKEN" ]; then
        echo -e "${RED}❌ Missing NPM_TOKEN environment variable.${NC}"
        echo "Export it before publishing, for example:"
        echo '  export NPM_TOKEN="<your-npm-token>"'
        exit 1
    fi

    echo ""
    echo "🔐 Verifying npm authentication..."
    pnpm release:check
    npm whoami >/dev/null

    REGISTRY=$(npm config get registry)
    if [ "$REGISTRY" != "https://registry.npmjs.org/" ]; then
        echo -e "${RED}❌ Unexpected npm registry: ${REGISTRY}${NC}"
        echo "Expected: https://registry.npmjs.org/"
        exit 1
    fi

    echo -e "${GREEN}✅ npm authentication looks good${NC}"
}

echo "📦 Agent Chatbot UI Deploy Script"
echo "================================="

ensure_npm_auth

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"

# Parse version argument
VERSION_TYPE=""
NEW_VERSION=""

if [ -n "$1" ]; then
    if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        NEW_VERSION="$1"
    else
        VERSION_TYPE="$1"
    fi
fi

# Calculate new version if needed
if [ -z "$NEW_VERSION" ]; then
    read -p "Enter version type (patch/minor/major) or full version (x.y.z): " input
    if [[ "$input" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        NEW_VERSION="$input"
    else
        VERSION_TYPE="$input"
    fi
fi

# Calculate version bump
if [ -n "$VERSION_TYPE" ]; then
    case "$VERSION_TYPE" in
        patch)
            NEW_VERSION=$(node -p "const v='${CURRENT_VERSION}'.split('.').map(Number); v[2]++; v.join('.')")
            ;;
        minor)
            NEW_VERSION=$(node -p "const v='${CURRENT_VERSION}'.split('.').map(Number); v[1]++; v[2]=0; v.join('.')")
            ;;
        major)
            NEW_VERSION=$(node -p "const v='${CURRENT_VERSION}'.split('.').map(Number); v[0]++; v[1]=0; v[2]=0; v.join('.')")
            ;;
        *)
            echo -e "${RED}❌ Invalid version type: $VERSION_TYPE${NC}"
            echo "Valid types: patch, minor, major"
            exit 1
            ;;
    esac
fi

echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Confirm before proceeding
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 1: Lint
echo ""
echo "🔍 Running lint check..."
pnpm lint

# Step 2: Build
echo ""
echo "🏗️  Building..."
pnpm build

# Step 3: Update version in package.json
echo ""
echo "📝 Updating version to ${NEW_VERSION}..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${NEW_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Version updated to ' + pkg.version);
"

# Step 4: Commit changes
echo ""
echo "📋 Committing changes..."
git add -A
git commit -m "release: v${NEW_VERSION}"

# Step 5: Create git tag
echo ""
echo "🏷️  Creating git tag..."
git tag "v${NEW_VERSION}"

# Step 6: Push
echo ""
echo "🚀 Pushing to remote..."
git push origin HEAD
git push origin "v${NEW_VERSION}"

# Step 7: Publish to npm
echo ""
echo "📦 Publishing to npm..."
npm publish

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Summary:"
echo "  - Version: ${NEW_VERSION}"
echo "  - Git tag: v${NEW_VERSION}"
echo "  - npm package: @chatbotui/agent-chatbot-ui@${NEW_VERSION}"
