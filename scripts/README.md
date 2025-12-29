# VPS Deployment Scripts

Automated deployment scripts for InterServer VPS hosting.

## Quick Start

### Prerequisites
- PowerShell or Git Bash on Windows
- SSH client installed
- Access to GitHub repository
- Render database URL (for migration)
- SMTP credentials for email

### VPS Details
- **IP Address:** 216.158.230.187
- **SSH Port:** 22
- **Initial User:** root
- **Deploy User:** deploy (created by script)

---

## Deployment Steps

### 1. Run Main Deployment Script

**Using PowerShell (Recommended):**
```powershell
cd C:\Users\Plange\Downloads\Projects\mining-erp
.\scripts\deploy-vps.ps1
```

**Using Git Bash:**
```bash
cd /c/Users/Plange/Downloads/Projects/mining-erp
pwsh scripts/deploy-vps.ps1
```

### 2. What the Script Does

The script will automatically:

1. **Test SSH Connection** - Verify connectivity to VPS
2. **Upload Scripts** - Transfer deployment scripts to VPS
3. **Server Setup** - Install Node.js, PostgreSQL, Nginx, etc.
4. **SSH Key Setup** - Configure passwordless SSH authentication
5. **Database Setup** - Create PostgreSQL database and user
6. **Database Migration** - Import data from Render (optional)
7. **Application Deployment** - Clone, build, and start applications
8. **Nginx Configuration** - Set up reverse proxy
9. **DNS Configuration** - Guide you through DNS setup
10. **SSL Certificates** - Obtain Let's Encrypt certificates

**Total Time:** 20-30 minutes (plus DNS propagation)

---

## During Deployment

### You'll Be Prompted For:

1. **PostgreSQL Password** - Strong password for database user
2. **Render Database URL** - For migration (optional)
3. **JWT Secret** - Auto-generated if left blank
4. **SMTP Credentials:**
   - SMTP Host (e.g., smtp.gmail.com)
   - SMTP Port (e.g., 587)
   - SMTP User (your email)
   - SMTP Password (app password)
   - SMTP From (noreply@yellowpowerinternational.com)
5. **DNS Confirmation** - Confirm when A records are added
6. **Email for SSL** - For Let's Encrypt notifications

### GitHub SSH Key

The script will generate an SSH key for GitHub access. When prompted:

1. Copy the displayed public key
2. Go to https://github.com/settings/keys
3. Click "New SSH key"
4. Paste the key and save
5. Press Enter in the script to continue

---

## DNS Configuration

Before SSL certificates can be obtained, add these A records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 216.158.230.187 | 300 |
| A | www | 216.158.230.187 | 300 |
| A | erp | 216.158.230.187 | 300 |

**DNS Propagation:** Usually 5-30 minutes, can take up to 48 hours.

---

## Manual Steps (If Needed)

### Run Individual Steps

If the full deployment fails, you can run individual steps:

```powershell
# Test connection only
.\scripts\deploy-vps.ps1 -Step 1

# Upload scripts only
.\scripts\deploy-vps.ps1 -Step 2

# Run server setup only
.\scripts\deploy-vps.ps1 -Step 3

# And so on... (steps 1-10)
```

### Connect to VPS Manually

```powershell
# As root (initial)
ssh root@216.158.230.187

# As deploy user (after setup)
ssh deploy@216.158.230.187
```

### Run Server Setup Manually

```bash
# On VPS as root
bash /tmp/server-setup.sh
```

### Deploy Application Manually

```bash
# On VPS as deploy user
bash /tmp/deploy-app.sh
```

### Setup Nginx Manually

```bash
# On VPS as deploy user
sudo bash /tmp/setup-nginx.sh
```

---

## Post-Deployment

### Verify Deployment

1. **Check Applications:**
   - https://erp.yellowpowerinternational.com
   - https://yellowpowerinternational.com

2. **Check PM2 Status:**
   ```bash
   ssh deploy@216.158.230.187
   pm2 status
   pm2 logs
   ```

3. **Check Nginx:**
   ```bash
   ssh deploy@216.158.230.187
   sudo systemctl status nginx
   sudo nginx -t
   ```

4. **Check Database:**
   ```bash
   ssh deploy@216.158.230.187
   psql -U mining_erp_user -d mining_erp_db -c "SELECT COUNT(*) FROM users;"
   ```

### Common Commands

```bash
# View application logs
ssh deploy@216.158.230.187 "pm2 logs"

# Restart applications
ssh deploy@216.158.230.187 "pm2 restart all"

# View Nginx logs
ssh deploy@216.158.230.187 "sudo tail -f /var/log/nginx/error.log"

# Check disk space
ssh deploy@216.158.230.187 "df -h"

# Check memory usage
ssh deploy@216.158.230.187 "free -h"

# View health check logs
ssh deploy@216.158.230.187 "tail -f /var/log/health-check.log"
```

---

## Updating Applications

### Quick Update Script

Create `scripts/update-app.ps1`:
```powershell
$VPS_IP = "216.158.230.187"
$DEPLOY_USER = "deploy"

ssh ${DEPLOY_USER}@${VPS_IP} @"
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
"@
```

Run with:
```powershell
.\scripts\update-app.ps1
```

---

## Troubleshooting

### SSH Connection Failed
- Verify IP address: 216.158.230.187
- Verify port: 22
- Check firewall allows SSH
- Try: `ssh -v root@216.158.230.187` for verbose output

### Database Migration Failed
- Verify Render database URL format
- Check network connectivity
- Ensure pg_dump is installed locally
- Try manual export/import

### SSL Certificate Failed
- Verify DNS is propagated: `nslookup erp.yellowpowerinternational.com`
- Check Nginx is running: `sudo systemctl status nginx`
- Check port 80/443 are open: `sudo ufw status`
- Try manual certbot: `sudo certbot --nginx -d erp.yellowpowerinternational.com`

### Application Not Starting
- Check PM2 logs: `pm2 logs`
- Verify environment variables: `cat /var/www/mining-erp/dev/backend/.env.production`
- Check database connection: `psql -U mining_erp_user -d mining_erp_db`
- Restart: `pm2 restart all`

### Nginx 502 Bad Gateway
- Check PM2 apps are running: `pm2 status`
- Verify ports 3000, 3001, 3002 are listening: `sudo netstat -tlnp | grep node`
- Check Nginx config: `sudo nginx -t`
- View Nginx errors: `sudo tail -f /var/log/nginx/error.log`

---

## Rollback to Render

If you need to rollback:

1. **Revert DNS A records** to Render IPs
2. **Wait 5-10 minutes** for DNS propagation
3. **Verify Render services** are still active
4. **Test application** on Render

---

## Security Notes

- Root SSH login is disabled after setup
- SSH key authentication required (no passwords)
- Firewall (UFW) blocks all ports except 22, 80, 443
- Fail2ban protects against brute force attacks
- PostgreSQL only accessible from localhost
- SSL certificates auto-renew via Certbot
- Automated backups run daily at 2 AM

---

## Backup & Recovery

### Database Backups
- **Location:** `/var/backups/postgresql/`
- **Schedule:** Daily at 2 AM
- **Retention:** 7 days
- **Manual backup:** `ssh deploy@216.158.230.187 "/usr/local/bin/backup-db.sh"`

### Restore Database
```bash
ssh deploy@216.158.230.187
cd /var/backups/postgresql
gunzip mining_erp_db_YYYYMMDD_HHMMSS.sql.gz
psql -U mining_erp_user -d mining_erp_db < mining_erp_db_YYYYMMDD_HHMMSS.sql
```

---

## Cost Savings

**Before (Render):** $60-100/month  
**After (InterServer VPS):** $24/month  
**Monthly Savings:** $36-76  
**Annual Savings:** $432-912

---

## Support

- **InterServer Support:** https://www.interserver.net/support/
- **VPS Control Panel:** https://manage.interserver.net/
- **Documentation:** See `notes/vps-*.md` files

---

## Files in This Directory

- `deploy-vps.ps1` - Main PowerShell deployment script
- `server-setup.sh` - Server initialization script (runs on VPS)
- `deploy-app.sh` - Application deployment script (runs on VPS)
- `setup-nginx.sh` - Nginx configuration script (runs on VPS)
- `README.md` - This file

---

**Last Updated:** December 26, 2025
