#!/bin/bash
# Application Deployment Script
# Run on VPS as deploy user

set -e

echo "========================================="
echo "Application Deployment"
echo "========================================="

# Setup GitHub SSH key
echo "[1/8] Setting up GitHub access..."
if [ ! -f ~/.ssh/github_deploy ]; then
    ssh-keygen -t ed25519 -C "deploy@yellowpowerinternational.com" -f ~/.ssh/github_deploy -N ""
    
    cat > ~/.ssh/config <<EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    IdentitiesOnly yes
EOF
    
    chmod 600 ~/.ssh/config
    
    echo ""
    echo "========================================="
    echo "⚠ IMPORTANT: Add this SSH key to GitHub"
    echo "========================================="
    cat ~/.ssh/github_deploy.pub
    echo "========================================="
    echo "Go to: https://github.com/settings/keys"
    echo "Click 'New SSH key' and paste the above key"
    echo ""
    read -p "Press Enter after adding the key to GitHub..."
fi

# Clone repository
echo "[2/8] Cloning repository..."
cd /var/www/mining-erp
if [ ! -d ".git" ]; then
    git clone git@github.com:yellowpowerint/erp-software.git .
else
    git pull origin main
fi

# Backend deployment
echo "[3/8] Deploying backend..."
cd /var/www/mining-erp/dev/backend

# Move env file
if [ -f /tmp/backend.env ]; then
    mv /tmp/backend.env .env.production
fi

# Install dependencies
npm install --production

# Build
npm run build

# Stop existing PM2 process
pm2 delete erp-backend 2>/dev/null || true

# Start with PM2
pm2 start dist/main.js --name erp-backend --env production

# Frontend deployment
echo "[4/8] Deploying ERP frontend..."
cd /var/www/mining-erp/dev/frontend

# Move env file
if [ -f /tmp/frontend.env ]; then
    mv /tmp/frontend.env .env.production
fi

# Install dependencies
npm install --production

# Build
npm run build

# Stop existing PM2 process
pm2 delete erp-frontend 2>/dev/null || true

# Start with PM2
pm2 start npm --name erp-frontend -- start -- -p 3001

# Main website deployment (if exists)
echo "[5/8] Checking for main website..."
if [ -d /var/www/yellowpower-website ]; then
    cd /var/www/yellowpower-website
    
    if [ ! -d ".git" ]; then
        echo "Skipping main website (no repository)"
    else
        git pull origin main
        npm install --production
        npm run build
        pm2 delete main-website 2>/dev/null || true
        pm2 start npm --name main-website -- start -- -p 3002
    fi
fi

# Save PM2 configuration
echo "[6/8] Saving PM2 configuration..."
pm2 save

# Setup database backup cron
echo "[7/8] Setting up automated backups..."
cat > /usr/local/bin/backup-db.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mining_erp_db"
DB_USER="mining_erp_user"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab if not exists
(crontab -l 2>/dev/null | grep -q backup-db.sh) || (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh") | crontab -

# Setup health check
echo "[8/8] Setting up health monitoring..."
cat > /usr/local/bin/health-check.sh <<'EOF'
#!/bin/bash
LOG="/var/log/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk space
DISK=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage at ${DISK}%" >> $LOG
fi

# Check PM2 apps
pm2 list | grep -q "errored"
if [ $? -eq 0 ]; then
    echo "[$DATE] WARNING: PM2 apps in error state" >> $LOG
    pm2 restart all
fi

# Check Nginx
systemctl is-active --quiet nginx || systemctl restart nginx

# Check PostgreSQL
systemctl is-active --quiet postgresql || systemctl restart postgresql
EOF

sudo chmod +x /usr/local/bin/health-check.sh
(crontab -l 2>/dev/null | grep -q health-check.sh) || (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -

echo "========================================="
echo "✓ Application deployment completed!"
echo "========================================="
echo ""
echo "PM2 Status:"
pm2 status
