#!/bin/bash
# Phase 16.6: Fillable Forms + Templates + Fill & Sign - Production Deployment Script

set -e

echo "========================================"
echo "Phase 16.6: Fillable Forms + Templates + Fill & Sign"
echo "Production Deployment Script"
echo "========================================"
echo ""

ROOT_PATH="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: Backend dependencies (already present in package.json for this repo)
echo "Step 1: Installing Backend Dependencies..."
cd "$ROOT_PATH/dev/backend"

npm install

echo "✓ Backend dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "Step 2: Generating Prisma Client..."
npx prisma generate

echo "✓ Prisma client generated"
echo ""

# Step 3: Apply migrations (production)
echo "Step 3: Applying database migrations..."
# NOTE: In Render, migrations run automatically in start:prod (npx prisma migrate deploy)
# This step is for manual/self-hosted environments.
npx prisma migrate deploy

echo "✓ Migrations applied"
echo ""

# Step 4: Build backend
echo "Step 4: Building backend..."
npm run build

echo "✓ Backend build completed"
echo ""

# Step 5: Build frontend
echo "Step 5: Building frontend..."
cd "$ROOT_PATH/dev/frontend"
npm install
npm run build

echo "✓ Frontend build completed"
echo ""

echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo "✓ Prisma client generated"
echo "✓ DB migrations deployed"
echo "✓ Backend build completed"
echo "✓ Frontend build completed"
echo ""
echo "Next Steps (Render):"
echo "1. Deploy backend and confirm /api/documents/:id/form-template works"
echo "2. Upload a fillable PDF and test Fillable Forms panel"
echo "3. Finalize draft and confirm version history updated"
echo ""
echo "Phase 16.6 deployment complete!"
