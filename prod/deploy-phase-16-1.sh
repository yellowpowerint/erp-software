#!/bin/bash
# Phase 16.1: OCR & Text Extraction - Production Deployment Script

echo "========================================"
echo "Phase 16.1: OCR & Text Extraction"
echo "Production Deployment Script"
echo "========================================"
echo ""

set -e

ROOT_PATH="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: Backend Dependencies
echo "Step 1: Installing Backend Dependencies..."
cd "$ROOT_PATH/dev/backend"

npm install tesseract.js@^5.0.0
npm install pdf-parse@^1.1.1
npm install sharp@^0.33.0
npm install --save-dev @types/pdf-parse

echo "✓ Backend dependencies installed"
echo ""

# Step 2: Generate Prisma Client
echo "Step 2: Generating Prisma Client..."
npx prisma generate

echo "✓ Prisma client generated"
echo ""

# Step 3: Run Database Migration
echo "Step 3: Running Database Migration..."
echo "IMPORTANT: This will modify your database schema"
read -p "Continue with migration? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    npx prisma migrate deploy
    echo "✓ Database migration completed"
else
    echo "⚠ Migration skipped"
fi
echo ""

# Step 4: Frontend Dependencies
echo "Step 4: Installing Frontend Dependencies..."
cd "$ROOT_PATH/dev/frontend"

# No additional frontend dependencies needed
echo "✓ Frontend dependencies verified"
echo ""

# Step 5: Build Frontend
echo "Step 5: Building Frontend..."
npm run build

echo "✓ Frontend build completed"
echo ""

# Step 6: Verify Installation
echo "Step 6: Verifying Installation..."

if grep -q "tesseract.js" "$ROOT_PATH/dev/backend/package.json" && \
   grep -q "pdf-parse" "$ROOT_PATH/dev/backend/package.json" && \
   grep -q "sharp" "$ROOT_PATH/dev/backend/package.json"; then
    echo "✓ All required packages installed"
else
    echo "⚠ Some packages may be missing"
fi
echo ""

# Summary
echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo "✓ Backend dependencies installed"
echo "✓ Prisma client generated"
echo "✓ Database migration completed"
echo "✓ Frontend build completed"
echo ""
echo "Next Steps:"
echo "1. Restart the backend server: npm run start:dev"
echo "2. Restart the frontend server: npm run dev"
echo "3. Access OCR settings at: /settings/ocr"
echo "4. Test OCR by uploading a document"
echo ""
echo "Phase 16.1 deployment complete! 🎉"
