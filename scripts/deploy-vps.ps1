# VPS Deployment Script for InterServer
# Run this from your local Windows machine with PowerShell

param(
    [string]$Step = "all"
)

$VPS_IP = "216.158.230.187"
$VPS_PORT = "22"
$VPS_USER = "root"
$DEPLOY_USER = "deploy"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS Deployment Script" -ForegroundColor Cyan
Write-Host "Target: $VPS_IP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Test-SSHConnection {
    Write-Host "`n[1/10] Testing SSH connection..." -ForegroundColor Yellow
    
    $result = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -p $VPS_PORT ${VPS_USER}@${VPS_IP} "echo 'Connection successful'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ SSH connection successful" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ SSH connection failed" -ForegroundColor Red
        Write-Host "Please verify IP, port, and credentials" -ForegroundColor Red
        return $false
    }
}

function Upload-Scripts {
    Write-Host "`n[2/10] Uploading deployment scripts to VPS..." -ForegroundColor Yellow
    
    # Upload server-side scripts
    scp -P $VPS_PORT scripts/server-setup.sh ${VPS_USER}@${VPS_IP}:/tmp/
    scp -P $VPS_PORT scripts/deploy-app.sh ${VPS_USER}@${VPS_IP}:/tmp/
    scp -P $VPS_PORT scripts/setup-nginx.sh ${VPS_USER}@${VPS_IP}:/tmp/
    scp -P $VPS_PORT scripts/setup-database.sh ${VPS_USER}@${VPS_IP}:/tmp/
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Scripts uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to upload scripts" -ForegroundColor Red
        exit 1
    }
}

function Run-ServerSetup {
    Write-Host "`n[3/10] Running server initial setup..." -ForegroundColor Yellow
    Write-Host "This will take 5-10 minutes..." -ForegroundColor Gray
    
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP} "bash /tmp/server-setup.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Server setup completed" -ForegroundColor Green
    } else {
        Write-Host "✗ Server setup failed" -ForegroundColor Red
        exit 1
    }
}

function Setup-SSHKey {
    Write-Host "`n[4/10] Setting up SSH key authentication..." -ForegroundColor Yellow
    
    $sshKeyPath = "$env:USERPROFILE\.ssh\id_ed25519.pub"
    
    if (-not (Test-Path $sshKeyPath)) {
        Write-Host "Generating SSH key..." -ForegroundColor Gray
        ssh-keygen -t ed25519 -C "deploy@yellowpowerinternational.com" -f "$env:USERPROFILE\.ssh\id_ed25519" -N '""'
    }
    
    $publicKey = Get-Content $sshKeyPath -Raw
    $publicKey = $publicKey.Trim()
    
    # Still using root to set up deploy user's SSH key
    ssh -p $VPS_PORT ${VPS_USER}@${VPS_IP} "mkdir -p /home/${DEPLOY_USER}/.ssh && echo '$publicKey' > /home/${DEPLOY_USER}/.ssh/authorized_keys && chmod 700 /home/${DEPLOY_USER}/.ssh && chmod 600 /home/${DEPLOY_USER}/.ssh/authorized_keys && chown -R ${DEPLOY_USER}:${DEPLOY_USER} /home/${DEPLOY_USER}/.ssh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ SSH key configured" -ForegroundColor Green
        
        # Test deploy user SSH connection
        Write-Host "Testing deploy user SSH connection..." -ForegroundColor Gray
        $testResult = ssh -p $VPS_PORT -o StrictHostKeyChecking=no ${DEPLOY_USER}@${VPS_IP} "echo 'SSH key works'"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deploy user SSH key authentication working" -ForegroundColor Green
        } else {
            Write-Host "⚠ SSH key test failed, but continuing..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ SSH key setup failed" -ForegroundColor Red
        exit 1
    }
}

function Setup-Database {
    Write-Host "`n[5/10] Setting up PostgreSQL database..." -ForegroundColor Yellow
    
    # Prompt for database password
    $dbPassword = Read-Host "Enter PostgreSQL password for mining_erp_user" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
    
    # Run database setup script
    ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} "bash /tmp/setup-database.sh '$dbPasswordPlain'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database created" -ForegroundColor Green
    } else {
        Write-Host "✗ Database setup failed" -ForegroundColor Red
        exit 1
    }
    
    # Save password for later use
    $script:DB_PASSWORD = $dbPasswordPlain
}

function Migrate-Database {
    Write-Host "`n[6/10] Migrating database from Render..." -ForegroundColor Yellow
    
    $renderDbUrl = Read-Host "Enter Render DATABASE_URL (postgresql://...)"
    
    if ($renderDbUrl) {
        Write-Host "Exporting database from Render..." -ForegroundColor Gray
        
        # Export locally
        $backupFile = "render_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
        pg_dump $renderDbUrl > $backupFile
        
        # Upload to VPS
        scp -P $VPS_PORT $backupFile ${DEPLOY_USER}@${VPS_IP}:/tmp/
        
        # Import on VPS
        ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} "psql -U mining_erp_user -d mining_erp_db -f /tmp/$backupFile && rm /tmp/$backupFile"
        
        # Clean up local file
        Remove-Item $backupFile
        
        Write-Host "✓ Database migrated" -ForegroundColor Green
    } else {
        Write-Host "⚠ Skipping database migration" -ForegroundColor Yellow
    }
}

function Deploy-Application {
    Write-Host "`n[7/10] Deploying application..." -ForegroundColor Yellow
    
    # Collect environment variables
    Write-Host "`nPlease provide environment variables:" -ForegroundColor Cyan
    
    $jwtSecret = Read-Host "JWT_SECRET (press Enter for auto-generated)"
    if (-not $jwtSecret) {
        $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    }
    
    $smtpHost = Read-Host "SMTP_HOST (e.g., smtp.gmail.com)"
    $smtpPort = Read-Host "SMTP_PORT (e.g., 587)"
    $smtpUser = Read-Host "SMTP_USER"
    $smtpPass = Read-Host "SMTP_PASS" -AsSecureString
    $smtpPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass))
    $smtpFrom = Read-Host "SMTP_FROM (e.g., noreply@yellowpowerinternational.com)"
    
    # Create env file content
    $backendEnv = @"
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://mining_erp_user:$($script:DB_PASSWORD)@localhost:5432/mining_erp_db
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
SMTP_HOST=$smtpHost
SMTP_PORT=$smtpPort
SMTP_USER=$smtpUser
SMTP_PASS=$smtpPassPlain
SMTP_FROM=$smtpFrom
FRONTEND_URL=https://erp.yellowpowerinternational.com
"@
    
    $frontendEnv = @"
NEXT_PUBLIC_API_URL=https://erp.yellowpowerinternational.com/api
NEXT_PUBLIC_APP_NAME=Yellow Power ERP
NODE_ENV=production
"@
    
    # Save env files locally
    $backendEnv | Out-File -FilePath "backend.env" -Encoding UTF8
    $frontendEnv | Out-File -FilePath "frontend.env" -Encoding UTF8
    
    # Upload env files
    scp -P $VPS_PORT backend.env ${DEPLOY_USER}@${VPS_IP}:/tmp/backend.env
    scp -P $VPS_PORT frontend.env ${DEPLOY_USER}@${VPS_IP}:/tmp/frontend.env
    
    # Clean up local env files
    Remove-Item backend.env, frontend.env
    
    # Run deployment script
    ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} "bash /tmp/deploy-app.sh"
    
    Write-Host "✓ Application deployed" -ForegroundColor Green
}

function Setup-Nginx {
    Write-Host "`n[8/10] Setting up Nginx and SSL..." -ForegroundColor Yellow
    
    ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} "sudo bash /tmp/setup-nginx.sh"
    
    Write-Host "✓ Nginx configured" -ForegroundColor Green
}

function Configure-DNS {
    Write-Host "`n[9/10] DNS Configuration Required" -ForegroundColor Yellow
    Write-Host "Please add these A records to your domain registrar:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Domain: yellowpowerinternational.com" -ForegroundColor White
    Write-Host "  Type: A, Name: @, Value: $VPS_IP, TTL: 300" -ForegroundColor Gray
    Write-Host "  Type: A, Name: www, Value: $VPS_IP, TTL: 300" -ForegroundColor Gray
    Write-Host "  Type: A, Name: erp, Value: $VPS_IP, TTL: 300" -ForegroundColor Gray
    Write-Host ""
    
    $dnsReady = Read-Host "Have you configured DNS? (yes/no)"
    
    if ($dnsReady -eq "yes") {
        Write-Host "Waiting for DNS propagation (30 seconds)..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
        
        # Test DNS
        $dnsTest = Resolve-DnsName -Name "erp.yellowpowerinternational.com" -ErrorAction SilentlyContinue
        
        if ($dnsTest) {
            Write-Host "✓ DNS configured" -ForegroundColor Green
        } else {
            Write-Host "⚠ DNS not yet propagated, may take up to 30 minutes" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Please configure DNS before obtaining SSL certificates" -ForegroundColor Yellow
    }
}

function Obtain-SSL {
    Write-Host "`n[10/10] Obtaining SSL certificates..." -ForegroundColor Yellow
    
    $email = Read-Host "Enter email for Let's Encrypt notifications"
    
    ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} "sudo certbot --nginx -d erp.yellowpowerinternational.com --non-interactive --agree-tos --email $email --redirect && sudo certbot --nginx -d yellowpowerinternational.com -d www.yellowpowerinternational.com --non-interactive --agree-tos --email $email --redirect"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ SSL certificates obtained" -ForegroundColor Green
    } else {
        Write-Host "⚠ SSL certificate setup failed - may need manual intervention" -ForegroundColor Yellow
        Write-Host "Run: ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP}" -ForegroundColor Gray
        Write-Host "Then: sudo certbot --nginx -d erp.yellowpowerinternational.com" -ForegroundColor Gray
    }
}

function Show-Summary {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your applications should be accessible at:" -ForegroundColor White
    Write-Host "  • https://erp.yellowpowerinternational.com" -ForegroundColor Cyan
    Write-Host "  • https://yellowpowerinternational.com" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To connect to VPS:" -ForegroundColor White
    Write-Host "  ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view application logs:" -ForegroundColor White
    Write-Host "  ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} 'pm2 logs'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To restart applications:" -ForegroundColor White
    Write-Host "  ssh -p $VPS_PORT ${DEPLOY_USER}@${VPS_IP} 'pm2 restart all'" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
try {
    if ($Step -eq "all" -or $Step -eq "1") {
        if (-not (Test-SSHConnection)) { exit 1 }
    }
    
    if ($Step -eq "all" -or $Step -eq "2") {
        Upload-Scripts
    }
    
    if ($Step -eq "all" -or $Step -eq "3") {
        Run-ServerSetup
    }
    
    if ($Step -eq "all" -or $Step -eq "4") {
        Setup-SSHKey
    }
    
    if ($Step -eq "all" -or $Step -eq "5") {
        Setup-Database
    }
    
    if ($Step -eq "all" -or $Step -eq "6") {
        Migrate-Database
    }
    
    if ($Step -eq "all" -or $Step -eq "7") {
        Deploy-Application
    }
    
    if ($Step -eq "all" -or $Step -eq "8") {
        Setup-Nginx
    }
    
    if ($Step -eq "all" -or $Step -eq "9") {
        Configure-DNS
    }
    
    if ($Step -eq "all" -or $Step -eq "10") {
        Obtain-SSL
    }
    
    Show-Summary
    
} catch {
    Write-Host "`n✗ Deployment failed: $_" -ForegroundColor Red
    exit 1
}
