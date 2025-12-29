# Mining ERP Manual Deployment Guide

## Server Info
- **IP:** 216.158.230.187
- **Domain:** erp.yellowpowerinternational.com
- **Backend Port:** 4000
- **Frontend Port:** 4001

## Step 1: Upload Files via PSCP

On your Windows machine:

```powershell
# Backend
cd "C:\Users\Plange\Downloads\Projects\mining-erp\dev\backend"
pscp -r . root@216.158.230.187:/var/www/mining-erp/backend/

# Frontend
cd "C:\Users\Plange\Downloads\Projects\mining-erp\dev\frontend"
pscp -r . root@216.158.230.187:/var/www/mining-erp/frontend/
```

## Step 2: In PuTTY - Setup Backend

```bash
cd /var/www/mining-erp/backend

# Create .env.production
cat > .env.production << 'EOF'
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://erp.yellowpowerinternational.com
JWT_SECRET=CHANGE_THIS_SECRET_KEY
JWT_EXPIRATION=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@yellowpowerinternational.com
SMTP_PASS=YOUR_PASSWORD
SMTP_FROM="Mining ERP <noreply@yellowpowerinternational.com>"
STORAGE_PROVIDER=local
BASE_URL=https://erp.yellowpowerinternational.com
EOF

# Edit with real values
nano .env.production

# Install and build
npm ci
npm run build

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Start with PM2
pm2 start npm --name "erp-backend" -- run start:prod
```

## Step 3: In PuTTY - Setup Frontend

```bash
cd /var/www/mining-erp/frontend

# Create .env.production
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://erp.yellowpowerinternational.com/api
NODE_ENV=production
EOF

# Install and build
npm ci
npm run build

# Start with PM2
pm2 start npm --name "erp-frontend" -- start -- -p 4001
pm2 save
```

## Step 4: Configure Nginx

```bash
cat > /etc/nginx/sites-available/erp.yellowpowerinternational.com << 'EOF'
server {
    listen 80;
    server_name erp.yellowpowerinternational.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/erp.yellowpowerinternational.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 5: SSL Certificate

After DNS points to server:

```bash
certbot --nginx -d erp.yellowpowerinternational.com
```

## Required Before Deployment

1. **Database:** Create PostgreSQL database (Neon/Railway/local)
2. **DNS:** Point erp.yellowpowerinternational.com A record to 216.158.230.187
3. **Email:** SMTP credentials for notifications
