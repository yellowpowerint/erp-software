# Nginx & SSL Setup

## 1. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

## 2. Configure Nginx for ERP
```bash
sudo nano /etc/nginx/sites-available/erp.yellowpowerinternational.com
```

**Content:**
```nginx
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
    
    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/erp.yellowpowerinternational.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yellowpowerinternational.com/privkey.pem;
    
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
```

## 3. Configure Nginx for Main Website
```bash
sudo nano /etc/nginx/sites-available/yellowpowerinternational.com
```

**Content:**
```nginx
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
    
    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yellowpowerinternational.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yellowpowerinternational.com/privkey.pem;
    
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
```

## 4. Enable Sites
```bash
sudo ln -s /etc/nginx/sites-available/erp.yellowpowerinternational.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/yellowpowerinternational.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 5. Install Certbot (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

## 6. Obtain SSL Certificates
**IMPORTANT: Configure DNS A records FIRST (see vps-dns-configuration.md)**

```bash
# For ERP domain
sudo certbot --nginx -d erp.yellowpowerinternational.com

# For main website
sudo certbot --nginx -d yellowpowerinternational.com -d www.yellowpowerinternational.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose redirect option (2)

## 7. Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

## 8. Configure SSL Security
```bash
sudo nano /etc/nginx/snippets/ssl-params.conf
```

**Content:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000" always;
```

**Add to server blocks:**
```bash
sudo nano /etc/nginx/sites-available/erp.yellowpowerinternational.com
```

Add inside `server` block (443):
```nginx
include snippets/ssl-params.conf;
```

Repeat for main website config.

## 9. Final Test
```bash
sudo nginx -t
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

## 10. Test in Browser
- https://erp.yellowpowerinternational.com
- https://yellowpowerinternational.com
- Check SSL certificate (should show Let's Encrypt)
