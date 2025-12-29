# DNS Configuration Guide

## Overview
Configure A records at your domain registrar to point to your VPS IP address.

## Required DNS Records

### For yellowpowerinternational.com

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 300 |
| A | www | YOUR_VPS_IP | 300 |

### For erp.yellowpowerinternational.com

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | erp | YOUR_VPS_IP | 300 |

**Note:** TTL of 300 seconds (5 minutes) allows quick rollback if needed.

## Step-by-Step Instructions

### 1. Get Your VPS IP Address
```bash
# On VPS, run:
curl ifconfig.me
# Or
ip addr show
```

### 2. Login to Domain Registrar
- Go to your domain registrar's website (e.g., Namecheap, GoDaddy, Cloudflare)
- Login to your account
- Navigate to DNS management for yellowpowerinternational.com

### 3. Add/Update A Records

**For Main Website:**
1. Add A record:
   - Type: A
   - Host: @ (or leave blank)
   - Value: YOUR_VPS_IP
   - TTL: 300

2. Add A record for www:
   - Type: A
   - Host: www
   - Value: YOUR_VPS_IP
   - TTL: 300

**For ERP Subdomain:**
3. Add A record:
   - Type: A
   - Host: erp
   - Value: YOUR_VPS_IP
   - TTL: 300

### 4. Remove Old Records
- Delete any existing A records pointing to Render IPs
- Keep MX records (email) if you have them
- Keep TXT records (SPF, DKIM, etc.) if you have them

### 5. Verify DNS Propagation

**Wait 5-10 minutes, then test:**

```bash
# Check from your local machine
nslookup yellowpowerinternational.com
nslookup www.yellowpowerinternational.com
nslookup erp.yellowpowerinternational.com

# Or use online tools:
# https://dnschecker.org/
```

**Expected output:**
```
Server:  ...
Address:  ...

Name:    yellowpowerinternational.com
Address:  YOUR_VPS_IP
```

### 6. Test HTTP Access (Before SSL)

```bash
# Should return Nginx or application response
curl http://yellowpowerinternational.com
curl http://erp.yellowpowerinternational.com
```

## Common DNS Registrars

### Namecheap
1. Dashboard → Domain List → Manage
2. Advanced DNS tab
3. Add New Record → A Record

### GoDaddy
1. My Products → DNS
2. Add → A Record

### Cloudflare
1. Select domain
2. DNS → Records → Add record
3. Type: A

### Google Domains
1. My domains → Manage
2. DNS → Custom records
3. Create new record → A

## Troubleshooting

### DNS Not Propagating
- Wait longer (can take up to 48 hours, usually 5-30 minutes)
- Clear local DNS cache:
  ```powershell
  # Windows
  ipconfig /flushdns
  ```
- Try different DNS checker: https://www.whatsmydns.net/

### Wrong IP Showing
- Verify you updated correct domain
- Check for multiple A records (delete old ones)
- Verify TTL has expired

### Still Showing Render
- Old DNS cache
- Browser cache (try incognito mode)
- Wait for TTL to expire

## Rollback Plan

If issues occur:

1. **Revert DNS:**
   - Change A records back to Render IPs
   - Wait 5-10 minutes for propagation

2. **Get Render IPs:**
   - Check Render dashboard
   - Or use: `nslookup your-app.onrender.com`

3. **Update A records:**
   - Point back to Render IPs
   - Test after 5-10 minutes

## Post-DNS Configuration

Once DNS is working:
1. Proceed to SSL certificate installation (vps-nginx-ssl-setup.md step 6)
2. Test HTTPS access
3. Monitor for 24-48 hours
4. Update any hardcoded URLs in application

## Verification Checklist

- [ ] VPS IP address confirmed
- [ ] A record for @ (root domain)
- [ ] A record for www
- [ ] A record for erp subdomain
- [ ] Old Render A records removed
- [ ] DNS propagation verified (nslookup)
- [ ] HTTP access working
- [ ] Ready for SSL certificate installation
