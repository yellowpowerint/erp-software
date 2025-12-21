#!/bin/bash
# Phase 16.5: Universal Document to PDF Conversion - Production Deployment Script

set -e

echo "========================================"
echo "Phase 16.5: Universal Document to PDF Conversion"
echo "Production Deployment Script"
echo "========================================"
echo ""

ROOT_PATH="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: Backend dependencies (already present in package.json for this repo)
echo "Step 1: Installing Backend Dependencies..."
cd "$ROOT_PATH/dev/backend"

npm install

echo " Backend dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "Step 2: Generating Prisma Client..."
npx prisma generate

echo " Prisma client generated"
echo ""

# Step 3: Apply migrations (production)
echo "Step 3: Applying database migrations..."
# NOTE: In Render, migrations run automatically in start:prod (npx prisma migrate deploy)
# This step is for manual/self-hosted environments.
npx prisma migrate deploy

echo " Migrations applied"
echo ""

# Step 4: Build backend
echo "Step 4: Building backend..."
npm run build

echo " Backend build completed"
echo ""

# Step 5: Frontend build
echo "Step 5: Building frontend..."
cd "$ROOT_PATH/dev/frontend"
npm install
npm run build

echo " Frontend build completed"
echo ""

echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo " Prisma client generated"
echo " DB migrations deployed"
echo " Backend build completed"
echo " Frontend build completed"
echo ""
echo "Next Steps (Render):"
echo "1. Ensure backend env vars include CONVERSION_WORKER_ENABLED=true"
echo "2. If using CloudConvert for Office/HTML, set CLOUDCONVERT_API_KEY and use S3 storage"
echo "3. Deploy and monitor logs for document conversion job processing"
echo ""
echo "Phase 16.5 deployment complete!"
