# InterServer VPS Deployment Overview

## Cost Comparison

**Current Render Setup:**
- Backend service: ~$15-25/month
- Frontend service: ~$15-25/month
- PostgreSQL database: ~$20-30/month
- Additional services: ~$10-20/month
- **Total: $60-100/month**

**InterServer VPS:**
- 4 Core CPU, 16GB RAM, 320GB Storage
- **Total: $24/month**
- **Savings: $36-76/month ($432-912/year)**

---

## Architecture Overview

### Domains
- **Main Website:** https://yellowpowerinternational.com
- **ERP Application:** https://erp.yellowpowerinternational.com

### Server Stack
- **OS:** Ubuntu 24.04 LTS (64-bit)
- **Web Server:** Nginx (reverse proxy + static file serving)
- **Backend Runtime:** Node.js 20.x LTS
- **Process Manager:** PM2 (auto-restart, clustering)
- **Database:** PostgreSQL 16
- **SSL Certificates:** Let's Encrypt (free, auto-renewal)
- **Firewall:** UFW (Uncomplicated Firewall)

### Application Structure
```
/var/www/
├── yellowpower-website/          # Main website (Next.js)
│   ├── .next/                    # Built Next.js app
│   ├── public/                   # Static assets
│   └── .env.production           # Environment variables
│
└── mining-erp/                   # ERP application
    ├── backend/                  # NestJS API
    │   ├── dist/                 # Compiled TypeScript
    │   ├── node_modules/
    │   └── .env.production       # Backend env vars
    │
    └── frontend/                 # Next.js dashboard
        ├── .next/                # Built Next.js app
        ├── public/               # Static assets
        └── .env.production       # Frontend env vars
```

### Port Allocation
- **80:** HTTP (redirects to HTTPS)
- **443:** HTTPS (Nginx)
- **3000:** Backend API (internal, PM2)
- **3001:** ERP Frontend (internal, PM2)
- **3002:** Main Website (internal, PM2)
- **5432:** PostgreSQL (localhost only)

### Traffic Flow
```
Internet
    ↓
Nginx (Port 443 - HTTPS)
    ↓
    ├─→ yellowpowerinternational.com → PM2 (Port 3002) → Main Website
    └─→ erp.yellowpowerinternational.com
            ↓
            ├─→ /api/* → PM2 (Port 3000) → Backend API
            └─→ /* → PM2 (Port 3001) → ERP Frontend
```

---

## Server Specifications

**InterServer VPS (KVM):**
- **CPU:** 4 Cores
- **RAM:** 16 GB
- **Storage:** 320 GB SSD
- **OS:** Ubuntu 24.04 64-bit
- **Network:** 1 Gbps
- **IPv4:** 1 dedicated IP address

**Resource Allocation Estimate:**
- PostgreSQL: ~2-4 GB RAM
- Backend API: ~1-2 GB RAM
- ERP Frontend: ~1-2 GB RAM
- Main Website: ~1 GB RAM
- System + Nginx: ~2 GB RAM
- **Total Used: ~7-11 GB (leaving 5-9 GB buffer)**

---

## Deployment Phases

### Phase 1: Server Setup (Day 1)
1. Initial SSH access and security hardening
2. Install system updates and essential packages
3. Configure firewall (UFW)
4. Create deployment user with sudo access
5. Set up SSH key authentication

### Phase 2: Database Setup (Day 1)
1. Install PostgreSQL 16
2. Create database and user
3. Configure PostgreSQL for production
4. Migrate data from Render PostgreSQL
5. Set up automated backups

### Phase 3: Application Stack (Day 1-2)
1. Install Node.js 20.x LTS
2. Install and configure PM2
3. Install and configure Nginx
4. Clone repositories
5. Install dependencies

### Phase 4: Application Deployment (Day 2)
1. Configure environment variables
2. Build applications (backend + frontends)
3. Set up PM2 processes
4. Configure Nginx virtual hosts
5. Test internal connectivity

### Phase 5: DNS & SSL (Day 2)
1. Configure A records at domain registrar
2. Install Certbot (Let's Encrypt)
3. Obtain SSL certificates
4. Configure Nginx for HTTPS
5. Set up auto-renewal

### Phase 6: Testing & Monitoring (Day 3)
1. Test all application features
2. Set up PM2 monitoring
3. Configure log rotation
4. Set up automated backups
5. Performance testing

---

## Prerequisites Checklist

### From InterServer
- [ ] VPS IP address
- [ ] Root SSH credentials
- [ ] VPS control panel access

### From Domain Registrar
- [ ] Access to DNS management
- [ ] Ability to add A records

### From Current Render Setup
- [ ] PostgreSQL database dump
- [ ] All environment variables
- [ ] API keys and secrets
- [ ] SSL certificate info (if custom)

### Local Development
- [ ] SSH client (PuTTY/OpenSSH)
- [ ] Git access to repositories
- [ ] Database backup/restore tools

---

## Security Considerations

1. **SSH Hardening:**
   - Disable root login
   - Use SSH keys only (no passwords)
   - Change default SSH port
   - Install fail2ban

2. **Firewall:**
   - Allow only ports 80, 443, and custom SSH port
   - Block all other incoming traffic
   - Allow all outgoing traffic

3. **Database:**
   - PostgreSQL accessible only from localhost
   - Strong password for database user
   - Regular automated backups

4. **Application:**
   - Environment variables in secure files (not in repo)
   - CORS configured properly
   - Rate limiting on API endpoints
   - Regular security updates

5. **SSL/TLS:**
   - Force HTTPS redirect
   - Strong cipher suites
   - HSTS headers
   - Auto-renewal of certificates

---

## Backup Strategy

1. **Database Backups:**
   - Daily automated dumps
   - Retain 7 daily, 4 weekly, 3 monthly
   - Store locally + offsite (S3/Backblaze)

2. **Application Backups:**
   - Git repository (already version controlled)
   - Environment files (encrypted backup)
   - Uploaded files/assets (if any)

3. **System Backups:**
   - Weekly full system snapshot (if InterServer supports)
   - Configuration files (/etc/nginx, PM2 configs)

---

## Monitoring & Maintenance

1. **Application Monitoring:**
   - PM2 monitoring dashboard
   - Application logs (PM2 log rotation)
   - Error tracking (existing Sentry integration)

2. **Server Monitoring:**
   - Disk space alerts
   - Memory usage monitoring
   - CPU load monitoring
   - SSL certificate expiry alerts

3. **Regular Maintenance:**
   - Weekly: Review logs, check disk space
   - Monthly: System updates, security patches
   - Quarterly: Review and optimize performance

---

## Rollback Plan

If deployment fails or issues arise:

1. **Keep Render active** during initial deployment
2. Test thoroughly on VPS before switching DNS
3. DNS TTL set to 300 seconds (5 minutes) for quick rollback
4. Database backup before migration
5. Document all configuration changes

**Rollback Steps:**
1. Revert DNS A records to Render IPs
2. Wait for DNS propagation (5-30 minutes)
3. Restore database from backup if needed
4. Debug VPS issues offline

---

## Next Steps

1. Review this overview document
2. Obtain VPS access credentials from InterServer
3. Follow detailed setup guides in order:
   - `vps-initial-setup.md`
   - `vps-database-setup.md`
   - `vps-application-deployment.md`
   - `vps-nginx-ssl-setup.md`
   - `vps-dns-configuration.md`
   - `vps-monitoring-backup.md`

---

## Support Resources

- **InterServer Support:** https://www.interserver.net/support/
- **Ubuntu Documentation:** https://help.ubuntu.com/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

**Estimated Total Deployment Time:** 2-3 days (with testing)
**Recommended Deployment Window:** Weekend or low-traffic period
**Team Required:** 1-2 developers with Linux/DevOps experience
