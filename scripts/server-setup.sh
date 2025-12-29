#!/bin/bash
# Server Initial Setup Script
# Run on VPS as root

set -e

echo "========================================="
echo "Server Initial Setup"
echo "========================================="

# Update system
echo "[1/12] Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "[2/12] Installing essential packages..."
apt install -y curl wget git ufw fail2ban unzip software-properties-common build-essential

# Create deploy user
echo "[3/12] Creating deploy user..."
if ! id -u deploy > /dev/null 2>&1; then
    # Create user with password "deploy123" (will be changed to SSH key only later)
    useradd -m -s /bin/bash deploy
    echo "deploy:deploy123" | chpasswd
    usermod -aG sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy
fi

# Configure firewall
echo "[4/12] Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Install Node.js 20.x
echo "[5/12] Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install global npm packages
echo "[6/12] Installing PM2 and Yarn..."
npm install -g pm2 yarn

# Install PostgreSQL 16
echo "[7/12] Installing PostgreSQL 16..."
apt install -y postgresql-16 postgresql-contrib-16

# Install Nginx
echo "[8/12] Installing Nginx..."
apt install -y nginx

# Install Certbot
echo "[9/12] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create application directories
echo "[10/12] Creating application directories..."
mkdir -p /var/www/mining-erp/{backend,frontend}
mkdir -p /var/www/yellowpower-website
mkdir -p /var/www/logs
mkdir -p /var/backups/{postgresql,app}
chown -R deploy:deploy /var/www
chown -R deploy:deploy /var/backups

# Create swap
echo "[11/12] Creating swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Set timezone
echo "[12/12] Setting timezone..."
timedatectl set-timezone Africa/Accra

# Configure fail2ban
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Setup PM2 startup
su - deploy -c "pm2 startup systemd -u deploy --hp /home/deploy" | tail -n 1 | bash

echo "========================================="
echo "✓ Server setup completed!"
echo "========================================="
