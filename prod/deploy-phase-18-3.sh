#!/bin/bash
# Phase 18.3 - Vendor Management Deployment Script (Bash)

set -e

echo "Phase 18.3 Deployment - Vendor Management"
echo ""

echo "1) Run DB migration in Render Postgres Query Console:"
echo "   dev/backend/prisma/migrations/20251221_add_phase_18_3_vendor_management/migration.sql"
read -p "Press Enter to continue"

echo "2) Build backend"
cd ../../dev/backend
npm run build

echo "3) Build frontend"
cd ../frontend
npm run build

echo "4) Commit + push"
cd ../..
git add .
git commit -m "feat: implement Phase 18.3 - Vendor Management"
git push origin main

echo "Done. Verify Render deploy + smoke test vendors/doc uploads/evaluations."
