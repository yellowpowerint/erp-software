# Monitoring & Backup Setup

## 1. PM2 Monitoring

### View Application Status
```bash
pm2 status
pm2 monit
pm2 logs
pm2 logs erp-backend --lines 100
```

### PM2 Log Management
```bash
# Install log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 2. System Monitoring

### Install Monitoring Tools
```bash
sudo apt install -y htop iotop nethogs
```

### Check Resources
```bash
# CPU and memory
htop

# Disk usage
df -h
ncdu /var/www

# Network
nethogs

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## 3. Automated Monitoring Script

Create `/usr/local/bin/health-check.sh`:
```bash
#!/bin/bash
LOG="/var/log/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Health Check" >> $LOG

# Check disk space
DISK=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK -gt 80 ]; then
    echo "WARNING: Disk usage at ${DISK}%" >> $LOG
fi

# Check memory
MEM=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ $MEM -gt 90 ]; then
    echo "WARNING: Memory usage at ${MEM}%" >> $LOG
fi

# Check PM2 apps
pm2 list | grep -q "errored"
if [ $? -eq 0 ]; then
    echo "WARNING: PM2 apps in error state" >> $LOG
    pm2 restart all
fi

# Check Nginx
systemctl is-active --quiet nginx
if [ $? -ne 0 ]; then
    echo "ERROR: Nginx is down" >> $LOG
    systemctl restart nginx
fi

# Check PostgreSQL
systemctl is-active --quiet postgresql
if [ $? -ne 0 ]; then
    echo "ERROR: PostgreSQL is down" >> $LOG
    systemctl restart postgresql
fi
```

```bash
sudo chmod +x /usr/local/bin/health-check.sh

# Run every 5 minutes
echo "*/5 * * * * /usr/local/bin/health-check.sh" | sudo crontab -
```

## 4. Database Backup

Already configured in `vps-database-setup.md`. Verify:
```bash
sudo crontab -l
ls -lh /var/backups/
```

## 5. Application Backup

Create `/usr/local/bin/backup-app.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/app"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Backup environment files
tar -czf $BACKUP_DIR/env_${DATE}.tar.gz \
    /var/www/mining-erp/dev/backend/.env.production \
    /var/www/mining-erp/dev/frontend/.env.production \
    /var/www/yellowpower-website/.env.production

# Backup Nginx configs
tar -czf $BACKUP_DIR/nginx_${DATE}.tar.gz \
    /etc/nginx/sites-available/

# Backup PM2 config
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_${DATE}.json

# Keep 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-app.sh
echo "0 3 * * * /usr/local/bin/backup-app.sh" | crontab -
```

## 6. SSL Certificate Monitoring

Certbot auto-renews, but verify:
```bash
# Check expiry
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

## 7. Log Files to Monitor

```bash
# Application logs
tail -f /var/www/logs/*.log

# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo tail -f /var/log/syslog

# Database logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

## 8. Alerts Setup (Optional)

### Email Alerts for Critical Issues

Install mail utility:
```bash
sudo apt install -y mailutils
```

Update health-check script to send emails:
```bash
# Add to health-check.sh
ADMIN_EMAIL="admin@yellowpowerinternational.com"

if [ $DISK -gt 90 ]; then
    echo "Disk usage critical: ${DISK}%" | mail -s "VPS Alert: Disk Space" $ADMIN_EMAIL
fi
```

## 9. Performance Monitoring

### Enable PM2 Metrics
```bash
pm2 install pm2-server-monit
```

### Database Query Monitoring
```bash
# Enable slow query log
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Add:
```conf
log_min_duration_statement = 1000  # Log queries > 1 second
```

## 10. Backup Verification

Test restore process monthly:
```bash
# Test database restore
pg_dump -U mining_erp_user mining_erp_db > test_backup.sql
dropdb -U mining_erp_user test_restore_db
createdb -U mining_erp_user test_restore_db
psql -U mining_erp_user test_restore_db < test_backup.sql
```

## Monitoring Checklist

Daily:
- [ ] Check PM2 status
- [ ] Review error logs
- [ ] Check disk space

Weekly:
- [ ] Review health check logs
- [ ] Verify backups exist
- [ ] Check SSL certificate expiry
- [ ] Review database performance

Monthly:
- [ ] Test backup restore
- [ ] Review and clean old logs
- [ ] Update system packages
- [ ] Review resource usage trends
