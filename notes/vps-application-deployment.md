# Application Deployment

## 1. Clone Repositories
```bash
cd /var/www/mining-erp
git clone git@github.com:yellowpowerint/erp-software.git .

# For main website (if separate repo)
cd /var/www/yellowpower-website
git clone git@github.com:yellowpowerint/website.git .
```

## 2. Backend Setup
```bash
cd /var/www/mining-erp/dev/backend

# Install dependencies
npm install --production

# Create production env file
nano .env.production
```

**`.env.production` content:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://mining_erp_user:PASSWORD@localhost:5432/mining_erp_db
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# SMTP (use your email provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yellowpowerinternational.com

# Frontend URL
FRONTEND_URL=https://erp.yellowpowerinternational.com

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
```

**Build and run:**
```bash
npm run build
pm2 start dist/main.js --name erp-backend --env production
pm2 save
```

## 3. ERP Frontend Setup
```bash
cd /var/www/mining-erp/dev/frontend

npm install --production

# Create env file
nano .env.production
```

**`.env.production`:**
```env
NEXT_PUBLIC_API_URL=https://erp.yellowpowerinternational.com/api
NEXT_PUBLIC_APP_NAME=Yellow Power ERP
NODE_ENV=production
```

**Build and run:**
```bash
npm run build
pm2 start npm --name erp-frontend -- start -- -p 3001
pm2 save
```

## 4. Main Website Setup
```bash
cd /var/www/yellowpower-website

npm install --production

nano .env.production
```

**`.env.production`:**
```env
NEXT_PUBLIC_SITE_URL=https://yellowpowerinternational.com
NODE_ENV=production
```

**Build and run:**
```bash
npm run build
pm2 start npm --name main-website -- start -- -p 3002
pm2 save
```

## 5. PM2 Configuration
```bash
# Enable PM2 startup on boot
pm2 startup
# Copy and run the command it outputs

# Save current process list
pm2 save

# Check status
pm2 status
pm2 logs
```

## 6. PM2 Monitoring
```bash
# View logs
pm2 logs erp-backend
pm2 logs erp-frontend
pm2 logs main-website

# Monitor resources
pm2 monit

# Restart apps
pm2 restart all
```

## 7. Update Script
Create `/var/www/update.sh`:
```bash
#!/bin/bash
cd /var/www/mining-erp
git pull origin main

# Backend
cd dev/backend
npm install --production
npm run build
pm2 restart erp-backend

# Frontend
cd ../frontend
npm install --production
npm run build
pm2 restart erp-frontend

echo "Update completed!"
```

```bash
chmod +x /var/www/update.sh
```
