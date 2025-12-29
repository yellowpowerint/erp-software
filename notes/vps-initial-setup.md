# VPS Initial Setup Guide

## 1. First SSH Connection
```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban unzip software-properties-common
```

## 2. Create Deploy User
```bash
adduser deploy
usermod -aG sudo deploy
```

## 3. SSH Key Setup
**Local machine:**
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

**On VPS:**
```bash
su - deploy
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # Paste public key
chmod 600 ~/.ssh/authorized_keys
exit
```

## 4. Harden SSH
```bash
sudo nano /etc/ssh/sshd_config
```
Set: `PermitRootLogin no`, `PasswordAuthentication no`, `Port 2222`
```bash
sudo systemctl restart sshd
```

## 5. Configure Firewall
```bash
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 6. Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 yarn
```

## 7. Create Directories
```bash
sudo mkdir -p /var/www
sudo chown -R deploy:deploy /var/www
mkdir -p /var/www/mining-erp/{backend,frontend}
mkdir -p /var/www/yellowpower-website
mkdir -p /var/www/logs
```

## 8. Setup Git for GitHub
```bash
ssh-keygen -t ed25519 -C "deploy@yellowpowerinternational.com" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub  # Add to GitHub SSH keys
```

Create `~/.ssh/config`:
```
Host github.com
    HostName github.com
    IdentityFile ~/.ssh/github_deploy
```

## 9. Set Timezone
```bash
sudo timedatectl set-timezone Africa/Accra
```

## 10. Create Swap
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Next:** Proceed to `vps-database-setup.md`
