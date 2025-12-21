#!/bin/bash
# Phase 17.3: CSV Advanced Features - Production Deployment Script

set -e

echo "========================================"
echo "Phase 17.3: CSV Advanced Features"
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
echo "CSV Worker Env Vars (Render backend):"
echo "- CSV_IMPORT_WORKER_ENABLED=true"
echo "- CSV_IMPORT_WORKER_CONCURRENCY=1"
echo "- CSV_IMPORT_WORKER_STUCK_MINUTES=30"
echo "- CSV_EXPORT_WORKER_ENABLED=true"
echo "- CSV_EXPORT_WORKER_CONCURRENCY=1"
echo "- CSV_EXPORT_WORKER_STUCK_MINUTES=30"
echo "- CSV_PREVIEW_ROWS=20"
echo ""
echo "Scheduled Exports Env Vars (Render backend):"
echo "- CSV_SCHEDULED_EXPORTS_ENABLED=true"
echo ""
echo "SMTP Env Vars (Render backend):"
echo "- SMTP_HOST=smtp.example.com"
echo "- SMTP_PORT=587"
echo "- SMTP_USER=your_smtp_user"
echo "- SMTP_PASS=your_smtp_password"
echo "- SMTP_FROM=Mining ERP <no-reply@your-domain.com>"
echo "- SMTP_SECURE=false"
echo ""
echo "Phase 17.3 deployment complete!"
