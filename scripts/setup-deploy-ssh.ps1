# Fix SSH Key Authentication for Deploy User
# Run this script locally to copy your SSH key to the deploy user

$SERVER_IP = "216.158.230.187"
$DEPLOY_USER = "deploy"
$SSH_PUB_KEY = Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Fixing SSH Key Authentication" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your SSH public key:" -ForegroundColor Yellow
Write-Host $SSH_PUB_KEY
Write-Host ""
Write-Host "Connecting to server as deploy user..." -ForegroundColor Yellow
Write-Host "Password: deploy123" -ForegroundColor Green
Write-Host ""

# Connect via SSH and run commands
Write-Host "Running: ssh ${DEPLOY_USER}@${SERVER_IP}" -ForegroundColor Yellow
Write-Host ""

$result = ssh ${DEPLOY_USER}@${SERVER_IP} "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$SSH_PUB_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key added successfully!'"

Write-Host $result
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Testing SSH connection..." -ForegroundColor Yellow

# Test the connection
ssh -o BatchMode=yes ${DEPLOY_USER}@${SERVER_IP} "echo 'SSH key authentication working!'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] SSH key authentication test successful!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] SSH key test failed. Try connecting manually." -ForegroundColor Red
}

Write-Host "=========================================" -ForegroundColor Cyan
