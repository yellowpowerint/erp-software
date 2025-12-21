#!/bin/bash
# Phase 18.2 - Procurement Automated Approval Workflows Deployment Script (Bash)

set -e

echo "Phase 18.2 Deployment - Automated Approval Workflows"
echo ""

echo "1) Run DB migration in Render Postgres Query Console:"
echo "   dev/backend/prisma/migrations/20251221_add_phase_18_2_procurement_workflows/migration.sql"
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
git commit -m "feat: implement Phase 18.2 - Automated Procurement Approval Workflows"
git push origin main

echo "Done. Verify Render deploy + smoke test workflows/delegations/approvals."
