#!/bin/bash

#############################################
# Mining ERP Quick Deployment to VPS
# Uses existing Render PostgreSQL database
#############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Mining ERP Quick Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
DEPLOY_DIR="/var/www/mining-erp"
BACKEND_PORT=4000
FRONTEND_PORT=4001
DOMAIN="erp.yellowpowerinternational.com"
DATABASE_URL="postgresql://mining_erp_db_user:ok85q5hMCUAuHfscA7u2WdO3HucYRCHS@dpg-d539e7be5dus73aoc1og-a.frankfurt-postgres.render.com/mining_erp_db"

# Create directories
echo -e "${GREEN}[1/10] Creating deployment directories...${NC}"
mkdir -p $DEPLOY_DIR/backend
mkdir -p $DEPLOY_DIR/frontend

# Check if files exist
if [ ! -f "$DEPLOY_DIR/backend/package.json" ]; then
    echo -e "${RED}Error: Backend files not found in $DEPLOY_DIR/backend${NC}"
    echo "Please upload files first using PSCP"
    exit 1
fi

if [ ! -f "$DEPLOY_DIR/frontend/package.json" ]; then
    echo -e "${RED}Error: Frontend files not found in $DEPLOY_DIR/frontend${NC}"
    echo "Please upload files first using PSCP"
    exit 1
fi

# Prompt for SMTP credentials
echo ""
echo -e "${YELLOW}Email Configuration (for notifications)${NC}"
read -p "SMTP User (email address): " SMTP_USER
read -sp "SMTP Password: " SMTP_PASS
echo ""

# Generate JWT secret
echo -e "${GREEN}[2/10] Generating JWT secret...${NC}"
JWT_SECRET=$(openssl rand -hex 32)

# Create backend .env.production
echo -e "${GREEN}[3/10] Creating backend environment file...${NC}"
cat > $DEPLOY_DIR/backend/.env.production << EOF
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# Application Configuration
PORT=$BACKEND_PORT
NODE_ENV=production
FRONTEND_URL=https://$DOMAIN

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM="Mining ERP <noreply@yellowpowerinternational.com>"
SMTP_SECURE=false

# Storage Configuration
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads

# Base URL
BASE_URL=https://$DOMAIN
EOF

# Create frontend .env.production
echo -e "${GREEN}[4/10] Creating frontend environment file...${NC}"
cat > $DEPLOY_DIR/frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NODE_ENV=production
EOF

# Install backend dependencies
echo -e "${GREEN}[5/10] Installing backend dependencies...${NC}"
cd $DEPLOY_DIR/backend
npm ci

# Build backend
echo -e "${GREEN}[6/10] Building backend...${NC}"
npm run build

# Run database migrations
echo -e "${GREEN}[7/10] Running database migrations...${NC}"
npx prisma migrate deploy
npx prisma generate

# Install frontend dependencies
echo -e "${GREEN}[8/10] Installing frontend dependencies...${NC}"
cd $DEPLOY_DIR/frontend
npm ci

# Build frontend
echo -e "${GREEN}[9/10] Building frontend...${NC}"
npm run build

# Start applications with PM2
echo -e "${GREEN}[10/10] Starting applications with PM2...${NC}"

# Stop existing processes if any
pm2 delete erp-backend 2>/dev/null || true
pm2 delete erp-frontend 2>/dev/null || true

# Start backend
cd $DEPLOY_DIR/backend
pm2 start npm --name "erp-backend" -- run start:prod

# Start frontend
cd $DEPLOY_DIR/frontend
pm2 start npm --name "erp-frontend" -- start -- -p $FRONTEND_PORT

pm2 save

# Configure Nginx
echo -e "${GREEN}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_EOF'
server {
    listen 80;
    server_name erp.yellowpowerinternational.com;
    client_max_body_size 50M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend API: http://$DOMAIN/api"
echo "Frontend: http://$DOMAIN"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Ensure DNS A record for $DOMAIN points to this server"
echo "2. Run: certbot --nginx -d $DOMAIN"
echo "3. Test: http://$DOMAIN"
echo ""
echo -e "${GREEN}Deployment logs saved to PM2${NC}"
echo "View backend logs: pm2 logs erp-backend"
echo "View frontend logs: pm2 logs erp-frontend"
