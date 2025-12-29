#!/bin/bash
# Deployment script for Mining ERP to VPS
# Server: 216.158.230.187
# Correct paths: /var/www/mining-erp/frontend and /var/www/mining-erp/backend

echo "=== Mining ERP Deployment Script ==="
echo "Deploying to: 216.158.230.187"
echo ""

# Navigate to project directory
cd /var/www/mining-erp || exit 1

echo "Step 1: Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "Step 2: Updating Backend..."
cd backend
npm ci
npm run build
npx prisma generate
pm2 restart erp-backend

echo ""
echo "Step 3: Updating Frontend..."
cd ../frontend
npm ci
npm run build
pm2 restart erp-frontend

echo ""
echo "Step 4: Checking PM2 status..."
pm2 status

echo ""
echo "=== Deployment Complete ==="
echo "Backend: Running on internal port (proxied by Nginx)"
echo "Frontend: https://erp.yellowpowerinternational.com"
echo ""
echo "Verify login page changes:"
echo "- Headline should be 'Welcome Back!'"
echo "- Copyright should be '© 2025 Yellow Power International. All Rights Reserved.'"
