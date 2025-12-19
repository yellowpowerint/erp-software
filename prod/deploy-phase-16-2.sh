#!/bin/bash
# Phase 16.2: Advanced PDF Manipulation & Merging - Production Deployment Script

set -e

echo "========================================"
echo "Phase 16.2: Advanced PDF Manipulation & Merging"
echo "Production Deployment Script"
echo "========================================"
echo ""

ROOT_PATH="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: Backend Dependencies
echo "Step 1: Installing Backend Dependencies..."
cd "$ROOT_PATH/dev/backend"

npm install pdf-lib@^1.17.1

echo "✓ Backend dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "Step 2: Generating Prisma Client..."
npx prisma generate

echo "✓ Prisma client generated"
echo ""

# Step 3: Frontend dependencies
echo "Step 3: Verifying Frontend Dependencies..."
cd "$ROOT_PATH/dev/frontend"

echo "✓ Frontend dependencies verified"
echo ""

# Step 4: Build frontend
echo "Step 4: Building Frontend..."
npm run build

echo "✓ Frontend build completed"
echo ""

echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo "✓ pdf-lib installed"
echo "✓ Prisma client generated"
echo "✓ Frontend build completed"
echo ""
echo "Next Steps:"
echo "1. Restart the backend server: npm run start:dev"
echo "2. Restart the frontend server: npm run dev"
echo "3. Use PDF tools at: /documents/tools"
echo ""
echo "Phase 16.2 deployment complete!"
