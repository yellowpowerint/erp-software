# VPS Deployment - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Prepare Information

Have these ready:
- [ ] Render database URL (for migration)
- [ ] SMTP credentials (Gmail/SendGrid/etc.)
- [ ] Access to domain registrar (for DNS)

### Step 2: Run Deployment Script

Open PowerShell and run:

```powershell
cd C:\Users\Plange\Downloads\Projects\mining-erp
.\scripts\deploy-vps.ps1
```

**The script will:**
- Connect to VPS (216.158.230.187)
- Install all required software
- Deploy applications
- Configure SSL certificates

**Time:** 20-30 minutes

### Step 3: Configure DNS

Add these A records at your domain registrar:

```
Type: A, Name: @,   Value: 216.158.230.187, TTL: 300
Type: A, Name: www, Value: 216.158.230.187, TTL: 300
Type: A, Name: erp, Value: 216.158.230.187, TTL: 300
```

---

## ✅ After Deployment

Your sites will be live at:
- **ERP:** https://erp.yellowpowerinternational.com
- **Website:** https://yellowpowerinternational.com

---

## 🔧 Common Commands

```powershell
# Connect to VPS
ssh deploy@216.158.230.187

# View logs
ssh deploy@216.158.230.187 "pm2 logs"

# Restart apps
ssh deploy@216.158.230.187 "pm2 restart all"

# Check status
ssh deploy@216.158.230.187 "pm2 status"
```

---

## 📞 Need Help?

See detailed guide: `scripts/README.md`

---

## 💰 Cost Savings

**Render:** $60-100/month  
**VPS:** $24/month  
**Savings:** $36-76/month ($432-912/year)
