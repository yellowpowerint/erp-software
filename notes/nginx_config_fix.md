# Nginx Configuration Fix for Document Preview/Download

## Problem
- Backend BASE_URL is set to `https://erp.yellowpowerinternational.com`
- Backend listens on `http://localhost:5000`
- File URLs like `https://erp.yellowpowerinternational.com/api/documents/files/general/...` fail because there's no reverse proxy

## Solution
Configure Nginx to proxy requests to the backend.

### Step 1: Create Nginx site config

```bash
sudo nano /etc/nginx/sites-available/erp.yellowpowerinternational.com
```

Add this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name erp.yellowpowerinternational.com;

    # Redirect HTTP to HTTPS (after SSL is set up)
    # return 301 https://$server_name$request_uri;

    # For now, proxy directly (remove this after SSL setup)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large file uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS configuration (after SSL cert is obtained)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name erp.yellowpowerinternational.com;

    # SSL certificates (use certbot to generate)
    ssl_certificate /etc/letsencrypt/live/erp.yellowpowerinternational.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erp.yellowpowerinternational.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large file uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 2: Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/erp.yellowpowerinternational.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Set up SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d erp.yellowpowerinternational.com
```

Follow prompts to obtain SSL certificate.

### Step 4: Update DNS

Ensure `erp.yellowpowerinternational.com` A record points to `216.158.230.187`

### Step 5: Test

After Nginx is configured:

```bash
# Test backend API
curl -I https://erp.yellowpowerinternational.com/api/documents

# Test file serving (replace with actual file path)
curl -I https://erp.yellowpowerinternational.com/api/documents/files/general/1234567890-test.pdf
```

## Alternative Quick Fix (HTTP only, for testing)

If you want to test immediately without SSL:

1. Update backend .env to use HTTP:
```bash
BASE_URL=http://erp.yellowpowerinternational.com
```

2. Set up basic Nginx proxy (HTTP only):
```bash
sudo nano /etc/nginx/sites-available/erp-http
```

```nginx
server {
    listen 80;
    server_name erp.yellowpowerinternational.com;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
}
```

3. Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/erp-http /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
pm2 restart 1 --update-env
```

4. Update frontend .env.production:
```bash
NEXT_PUBLIC_API_URL=http://erp.yellowpowerinternational.com/api
```

5. Rebuild frontend:
```bash
cd /var/www/mining-erp/frontend
npm run build
pm2 restart 9
```

## Verification Checklist

- [ ] DNS points to server IP
- [ ] Nginx is installed and running
- [ ] Site config is enabled
- [ ] SSL certificate obtained (for HTTPS)
- [ ] Backend BASE_URL matches public domain
- [ ] Frontend can reach backend API
- [ ] File downloads work
- [ ] PDF preview works
