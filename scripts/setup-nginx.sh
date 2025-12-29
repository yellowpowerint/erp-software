#!/bin/bash
# Nginx and SSL Setup Script
# Run on VPS with sudo

set -e

echo "========================================="
echo "Nginx Configuration Setup"
echo "========================================="

# Create Nginx config for ERP
echo "[1/4] Creating Nginx config for ERP..."
cat > /etc/nginx/sites-available/erp.yellowpowerinternational.com <<'EOF'
server {
    listen 80;
    server_name erp.yellowpowerinternational.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name erp.yellowpowerinternational.com;
    
    # SSL certificates will be added by Certbot
    
    client_max_body_size 50M;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Create Nginx config for main website
echo "[2/4] Creating Nginx config for main website..."
cat > /etc/nginx/sites-available/yellowpowerinternational.com <<'EOF'
server {
    listen 80;
    server_name yellowpowerinternational.com www.yellowpowerinternational.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yellowpowerinternational.com www.yellowpowerinternational.com;
    
    # SSL certificates will be added by Certbot
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable sites
echo "[3/4] Enabling sites..."
ln -sf /etc/nginx/sites-available/erp.yellowpowerinternational.com /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/yellowpowerinternational.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
echo "[4/4] Testing and reloading Nginx..."
nginx -t
systemctl reload nginx

echo "========================================="
echo "✓ Nginx configuration completed!"
echo "========================================="
