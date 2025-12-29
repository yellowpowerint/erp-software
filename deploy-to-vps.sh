#!/bin/bash
# Deployment script for Mining ERP to VPS
# Server: 216.158.230.187

echo "=== Mining ERP Deployment Script ==="
echo "Deploying to: 216.158.230.187"
echo ""

# Navigate to project directory on server
cd /var/www/erp || exit 1

echo "1. Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "2. Installing frontend dependencies..."
cd dev/frontend
npm install

echo ""
echo "3. Building frontend application..."
npm run build

echo ""
echo "4. Restarting PM2 process..."
pm2 restart erp-frontend

echo ""
echo "5. Checking PM2 status..."
pm2 status

echo ""
echo "=== Deployment Complete ==="
echo "Frontend should now be live at: https://erp.yellowpowerinternational.com"
