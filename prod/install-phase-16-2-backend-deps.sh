#!/bin/bash
# Phase 16.2: Advanced PDF Manipulation & Merging - Backend Dependencies Installation Script

set -e

echo "Installing Phase 16.2 Backend Dependencies..."

cd "$(dirname "$0")/../dev/backend"

npm install pdf-lib@^1.17.1

echo "Backend dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npx prisma generate"
echo "2. Restart the backend server"
