#!/bin/bash
# Phase 16.8: Scan Cleanup + Hardened PDF Security - Production Deployment Script

set -e

echo "========================================"
echo "Phase 16.8: Finalize PDFs (cleanup/redact/security)"
echo "Production Deployment Script"
echo "========================================"
echo ""

ROOT_PATH="$(cd "$(dirname "$0")/.." && pwd)"

echo "Step 1: Installing backend dependencies..."
cd "$ROOT_PATH/dev/backend"
npm install

echo "Step 2: Generating Prisma client..."
npx prisma generate

echo "Step 3: Applying migrations..."
# NOTE: Render runs this automatically via start:prod (npx prisma migrate deploy)
# This is for manual/self-hosted environments.
npx prisma migrate deploy

echo "Step 4: Building backend..."
npm run build

echo "Step 5: Building frontend..."
cd "$ROOT_PATH/dev/frontend"
npm install
npm run build

echo ""
echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo "✓ Prisma client generated"
echo "✓ DB migrations deployed"
echo "✓ Backend build completed"
echo "✓ Frontend build completed"
echo ""
echo "Worker Env Vars (Render backend):"
echo "- FINALIZE_WORKER_ENABLED=true"
echo "- FINALIZE_WORKER_CONCURRENCY=1"
echo "- FINALIZE_WORKER_STUCK_MINUTES=30"
echo ""
echo "Phase 16.8 deployment complete!"
