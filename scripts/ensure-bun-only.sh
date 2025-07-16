#!/bin/bash

# Ensure Bun-only environment script
# This script helps maintain a Bun-only development environment

echo "🔍 Checking for npm-related files..."

# Check for npm lockfiles
if [ -f "package-lock.json" ]; then
    echo "❌ Found package-lock.json - removing..."
    rm package-lock.json
fi

if [ -f "yarn.lock" ]; then
    echo "❌ Found yarn.lock - removing..."
    rm yarn.lock
fi

if [ -f "pnpm-lock.yaml" ]; then
    echo "❌ Found pnpm-lock.yaml - removing..."
    rm pnpm-lock.yaml
fi

# Check for npm config files
if [ -f ".npmrc" ]; then
    echo "❌ Found .npmrc - removing..."
    rm .npmrc
fi

if [ -f ".npmignore" ]; then
    echo "❌ Found .npmignore - removing..."
    rm .npmignore
fi

# Check for npm debug logs
npm_logs=$(find . -maxdepth 1 -name "npm-debug.log*" 2>/dev/null)
if [ -n "$npm_logs" ]; then
    echo "❌ Found npm debug logs - removing..."
    rm npm-debug.log*
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun-only environment check completed!"
echo "📦 Use 'bun install' to install dependencies"
echo "🚀 Use 'bun run dev' to start development server"
echo "🔨 Use 'bun run build' to build for production" 