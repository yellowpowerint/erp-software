#!/bin/bash
# Phase 18.1 - Procurement Requisition Management Deployment Script (Bash)
# This script deploys Session 18.1 to Render.com

echo "========================================"
echo "Phase 18.1 Deployment - Requisition Management"
echo "========================================"
echo ""

# Step 1: Database Migration
echo "Step 1: Running Database Migration..."
echo "Navigate to Render Dashboard > PostgreSQL > Query"
echo "Run the migration SQL from:"
echo "  dev/backend/prisma/migrations/20251221_add_phase_18_1_requisitions/migration.sql"
echo ""
echo "Press Enter after migration is complete..."
read

# Step 2: Backend Deployment
echo "Step 2: Deploying Backend..."
cd ../../dev/backend
echo "Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "Backend build failed!"
    exit 1
fi

echo "Backend built successfully!"
echo ""

# Step 3: Frontend Deployment
echo "Step 3: Deploying Frontend..."
cd ../frontend
echo "Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi

echo "Frontend built successfully!"
echo ""

# Step 4: Git Deployment
echo "Step 4: Committing and Pushing to GitHub..."
cd ../..
git add .
git commit -m "feat: implement Phase 18.1 - Procurement Requisition Management

- Add Prisma schema for requisitions, items, attachments, approvals
- Implement ProcurementModule with RequisitionsService and controller
- Add /api/procurement/requisitions endpoints with RBAC
- Create frontend pages: list, create, detail
- Add menu integration for requisition management
- Support multi-stage approval workflow
- File attachment upload functionality
- Mining-specific requisition types and priorities"

git push origin main

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Verify Render auto-deployment completed successfully"
echo "2. Check backend logs for any migration errors"
echo "3. Test requisition creation and approval workflow"
echo "4. Verify file upload functionality"
echo "5. Test role-based access controls"
echo ""
echo "Frontend URL: https://your-frontend.onrender.com/procurement/requisitions"
echo "Backend API: https://your-backend.onrender.com/api/procurement/requisitions"
echo ""
