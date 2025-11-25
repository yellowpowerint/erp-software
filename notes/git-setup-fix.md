# Git Identity Setup - Fix

## 🔧 Issue
Git doesn't know who you are yet. You need to configure your identity first.

---

## ✅ Solution - Run These Commands

### Option 1: Global Configuration (Recommended)
This sets your identity for ALL git projects on your computer:

```powershell
# Set your email (use your GitHub email)
git config --global user.email "your-email@example.com"

# Set your name
git config --global user.name "Your Name"
```

**Example:**
```powershell
git config --global user.email "admin@webblabs.org"
git config --global user.name "Webblabs"
```

---

### Option 2: Project-Only Configuration
This sets your identity ONLY for this project:

```powershell
cd C:\Users\Plange\Downloads\Projects\mining-erp

# Set your email (use your GitHub email)
git config user.email "your-email@example.com"

# Set your name
git config user.name "Your Name"
```

---

## 📋 Complete Setup Commands

Run these in order:

```powershell
# 1. Configure Git identity (choose one option above)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# 2. Verify configuration
git config user.email
git config user.name

# 3. Now commit
git commit -m "Initial project setup - Phase 1, Session 1.1 complete

- Initialize Next.js 14 frontend with TypeScript and TailwindCSS
- Initialize NestJS backend with TypeScript and Prisma  
- Configure PostgreSQL database schema with user roles and RBAC
- Setup project structure with frontend, backend, and documentation
- Create comprehensive 34-session development plan
- Define dashboard menu structure with role-based navigation
- Add deployment configurations for Railway and Vercel

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

# 4. Set main branch
git branch -M main

# 5. Add remote (if not already added)
git remote add origin https://github.com/webblabsorg/erp.git

# 6. Push to GitHub
git push -u origin main
```

---

## ❓ What Email Should I Use?

**Use the email associated with your GitHub account:**
1. Go to: https://github.com/settings/emails
2. Use your primary email listed there
3. This ensures your commits are linked to your GitHub profile

---

## ✅ Verification

After setting up, verify your configuration:

```powershell
# Check global config
git config --global --list

# Check local project config
git config --list
```

You should see:
```
user.name=Your Name
user.email=your-email@example.com
```

---

## 🚀 After Git Identity is Set

Proceed with the commit and push commands as normal!
