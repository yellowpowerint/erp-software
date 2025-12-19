#!/bin/bash
# Phase 16.1: OCR & Text Extraction - Backend Dependencies Installation Script

echo "Installing Phase 16.1 Backend Dependencies..."

cd "$(dirname "$0")/../dev/backend"

# Install OCR dependencies
npm install tesseract.js@^5.0.0
npm install pdf-parse@^1.1.1
npm install sharp@^0.33.0

# Install types
npm install --save-dev @types/pdf-parse

echo "Backend dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npx prisma generate"
echo "2. Run: npx prisma migrate deploy"
echo "3. Restart the backend server"
