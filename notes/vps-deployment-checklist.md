# VPS Deployment Checklist

## Pre-Deployment

### From InterServer
- [ ] VPS IP address: ___________________
- [ ] Root password received
- [ ] VPS control panel access confirmed

### From Domain Registrar
- [ ] Access to DNS management for yellowpowerinternational.com
- [ ] Ability to add/modify A records confirmed

### From Render
- [ ] Export PostgreSQL database
- [ ] Document all environment variables
- [ ] Note current database connection string
- [ ] List all API keys and secrets

### Local Setup
- [ ] SSH client installed (PowerShell/PuTTY)
- [ ] Git access to repositories
- [ ] Database backup tools ready

---

## Day 1: Server Setup

### Initial Setup (2-3 hours)
- [ ] SSH into VPS as root
- [ ] Update system packages
- [ ] Create deploy user
- [ ] Set up SSH key authentication
- [ ] Test SSH key login
- [ ] Harden SSH (disable root, change port)
- [ ] Configure UFW firewall
- [ ] Install fail2ban
- [ ] Set timezone
- [ ] Create swap file
- [ ] Install Node.js 20.x
- [ ] Install PM2 globally
- [ ] Create application directories
- [ ] Set up GitHub SSH key

**Reference:** `vps-initial-setup.md`

### Database Setup (1-2 hours)
- [ ] Install PostgreSQL 16
- [ ] Create database and user
- [ ] Configure PostgreSQL for production
- [ ] Export database from Render
- [ ] Import database to VPS
- [ ] Test database connection
- [ ] Set up automated backups
- [ ] Add backup cron job

**Reference:** `vps-database-setup.md`

---

## Day 2: Application Deployment

### Clone and Build (2-3 hours)
- [ ] Clone ERP repository
- [ ] Clone website repository (if separate)
- [ ] Create backend .env.production
- [ ] Create ERP frontend .env.production
- [ ] Create website .env.production
- [ ] Install backend dependencies
- [ ] Build backend
- [ ] Install ERP frontend dependencies
- [ ] Build ERP frontend
- [ ] Install website dependencies
- [ ] Build website

**Reference:** `vps-application-deployment.md`

### PM2 Setup (30 minutes)
- [ ] Start backend with PM2
- [ ] Start ERP frontend with PM2
- [ ] Start website with PM2
- [ ] Configure PM2 startup
- [ ] Save PM2 process list
- [ ] Test PM2 restart
- [ ] Verify all apps running

### Nginx Setup (1 hour)
- [ ] Install Nginx
- [ ] Create ERP site config
- [ ] Create website site config
- [ ] Enable sites
- [ ] Remove default site
- [ ] Test Nginx configuration
- [ ] Reload Nginx

**Reference:** `vps-nginx-ssl-setup.md`

---

## Day 2-3: DNS & SSL

### DNS Configuration (30 minutes + propagation time)
- [ ] Get VPS IP address
- [ ] Login to domain registrar
- [ ] Add A record for @ (root)
- [ ] Add A record for www
- [ ] Add A record for erp subdomain
- [ ] Remove old Render A records
- [ ] Set TTL to 300 seconds
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Verify with nslookup
- [ ] Test HTTP access

**Reference:** `vps-dns-configuration.md`

### SSL Certificates (30 minutes)
- [ ] Install Certbot
- [ ] Obtain SSL for ERP domain
- [ ] Obtain SSL for main domain
- [ ] Test auto-renewal
- [ ] Configure SSL security settings
- [ ] Test HTTPS access
- [ ] Verify SSL certificates in browser

**Reference:** `vps-nginx-ssl-setup.md` (steps 5-10)

---

## Day 3: Testing & Monitoring

### Application Testing (2-3 hours)
- [ ] Test main website homepage
- [ ] Test ERP login
- [ ] Test ERP dashboard
- [ ] Test backend API endpoints
- [ ] Test database connectivity
- [ ] Test file uploads (if any)
- [ ] Test email sending
- [ ] Test mobile app connectivity
- [ ] Test all W1-W3 features
- [ ] Check browser console for errors
- [ ] Test on mobile devices

### Monitoring Setup (1 hour)
- [ ] Install monitoring tools
- [ ] Set up health check script
- [ ] Configure PM2 log rotation
- [ ] Set up application backup script
- [ ] Test backup scripts
- [ ] Configure email alerts (optional)
- [ ] Set up log monitoring

**Reference:** `vps-monitoring-backup.md`

### Performance Testing
- [ ] Check page load times
- [ ] Check API response times
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor disk space
- [ ] Check database query performance

---

## Post-Deployment

### Documentation
- [ ] Document VPS IP and credentials (secure location)
- [ ] Document database credentials
- [ ] Document all environment variables
- [ ] Update team documentation
- [ ] Create runbook for common tasks

### Cleanup
- [ ] Remove Render services (after 1 week of stable operation)
- [ ] Cancel Render subscription
- [ ] Archive Render database backups
- [ ] Update any external services pointing to old URLs

### Ongoing Maintenance
- [ ] Set up weekly backup verification
- [ ] Schedule monthly security updates
- [ ] Monitor SSL certificate expiry
- [ ] Review logs weekly
- [ ] Monitor costs and resource usage

---

## Rollback Plan

If critical issues occur:

1. **Immediate Actions:**
   - [ ] Revert DNS A records to Render IPs
   - [ ] Wait 5-10 minutes for propagation
   - [ ] Verify Render services are still active
   - [ ] Test application on Render

2. **Investigation:**
   - [ ] Review VPS logs
   - [ ] Check PM2 status
   - [ ] Check Nginx error logs
   - [ ] Check database connectivity
   - [ ] Document issues

3. **Resolution:**
   - [ ] Fix issues on VPS
   - [ ] Test thoroughly
   - [ ] Switch DNS back to VPS
   - [ ] Monitor closely

---

## Success Criteria

- [ ] Both domains accessible via HTTPS
- [ ] SSL certificates valid and auto-renewing
- [ ] All application features working
- [ ] Database queries performing well
- [ ] Backups running automatically
- [ ] Monitoring in place
- [ ] No errors in logs
- [ ] Mobile app connecting successfully
- [ ] Email sending working
- [ ] Performance equal to or better than Render

---

## Emergency Contacts

- **InterServer Support:** https://www.interserver.net/support/
- **Domain Registrar Support:** ___________________
- **Team Lead:** ___________________
- **Database Admin:** ___________________

---

## Estimated Timeline

- **Day 1:** Server setup + Database (4-5 hours)
- **Day 2:** Application deployment + Nginx + DNS (4-5 hours)
- **Day 3:** SSL + Testing + Monitoring (3-4 hours)
- **Total:** 11-14 hours over 3 days

---

## Cost Savings Verification

**Before (Render):**
- Monthly cost: $60-100
- Annual cost: $720-1,200

**After (InterServer VPS):**
- Monthly cost: $24
- Annual cost: $288

**Savings:**
- Monthly: $36-76
- Annual: $432-912
- 3-year: $1,296-2,736

**ROI:** Deployment effort pays for itself in first month!
