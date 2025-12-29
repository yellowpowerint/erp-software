# PostgreSQL Setup

## Install
```bash
sudo apt install -y postgresql-16 postgresql-contrib-16
```

## Create Database
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE mining_erp_db;
CREATE USER mining_erp_user WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE mining_erp_db TO mining_erp_user;
\c mining_erp_db
GRANT ALL ON SCHEMA public TO mining_erp_user;
\q
```

## Migrate from Render
```bash
# Local: Export from Render
pg_dump "RENDER_DATABASE_URL" > backup.sql

# Upload to VPS
scp -P 2222 backup.sql deploy@VPS_IP:/tmp/

# VPS: Import
psql -U mining_erp_user -d mining_erp_db -f /tmp/backup.sql
```

## Auto Backup Script
```bash
sudo nano /usr/local/bin/backup-db.sh
```
```bash
#!/bin/bash
pg_dump -U mining_erp_user mining_erp_db | gzip > /var/backups/db_$(date +%Y%m%d).sql.gz
find /var/backups -name "db_*.sql.gz" -mtime +7 -delete
```
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
echo "0 2 * * * /usr/local/bin/backup-db.sh" | sudo crontab -
```
