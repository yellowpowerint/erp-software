#!/bin/bash

#############################################
# Mining ERP VPS Deployment Script
# Run this directly on the VPS via PuTTY
#############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Mining ERP Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Configuration
DEPLOY_DIR="/var/www/mining-erp"
BACKEND_PORT=4000
FRONTEND_PORT=4001
DOMAIN="erp.yellowpowerinternational.com"

# Create directories
echo -e "${GREEN}Creating deployment directories...${NC}"
mkdir -p $DEPLOY_DIR/backend
mkdir -p $DEPLOY_DIR/frontend

# Prompt for database URL
echo ""
echo -e "${YELLOW}Database Configuration${NC}"
read -p "Enter DATABASE_URL (PostgreSQL connection string): " DATABASE_URL

# Prompt for email config
echo ""
echo -e "${YELLOW}Email Configuration${NC}"
read -p "SMTP Host (default: smtp.gmail.com): " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
read -p "SMTP Port (default: 587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}
read -p "SMTP User: " SMTP_USER
read -sp "SMTP Password: " SMTP_PASS
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)

echo ""
echo -e "${GREEN}Creating backend .env.production...${NC}"
cat > $DEPLOY_DIR/backend/.env.production << EOF
DATABASE_URL="$DATABASE_URL"
PORT=$BACKEND_PORT
NODE_ENV=production
FRONTEND_URL=https://$DOMAIN
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=7d
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM="Mining ERP <noreply@yellowpowerinternational.com>"
SMTP_SECURE=false
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
BASE_URL=https://$DOMAIN
EOF

echo -e "${GREEN}Creating frontend .env.production...${NC}"
cat > $DEPLOY_DIR/frontend/.env.production << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NODE_ENV=production
EOF

echo ""
echo -e "${GREEN}Installing backend dependencies...${NC}"
cd $DEPLOY_DIR/backend
npm ci

echo -e "${GREEN}Building backend...${NC}"
npm run build

echo -e "${GREEN}Running database migrations...${NC}"
npx prisma migrate deploy
npx prisma generate

echo ""
echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd $DEPLOY_DIR/frontend
npm ci

echo -e "${GREEN}Building frontend...${NC}"
npm run build

echo ""
echo -e "${GREEN}Starting applications with PM2...${NC}"

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

echo ""
echo -e "${GREEN}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_EOF'
server {
    listen 80;
    server_name erp.yellowpowerinternational.com;
    client_max_body_size 50M;

    # Frontend
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
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend: http://$DOMAIN/api"
echo "Frontend: http://$DOMAIN"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Point DNS A record for $DOMAIN to this server IP"
echo "2. Run: certbot --nginx -d $DOMAIN"
echo "3. Test: http://$DOMAIN"
