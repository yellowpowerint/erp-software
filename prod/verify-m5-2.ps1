# Verify M5.2 - Document Viewer (PowerShell)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  if (-not [string]::IsNullOrWhiteSpace($PSScriptRoot)) {
    return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  }
  $path = $MyInvocation.MyCommand.Path
  if (-not $path) {
    throw "Unable to determine script path (PSScriptRoot/MyInvocation are empty)"
  }
  $here = Split-Path -Parent $path
  return (Resolve-Path (Join-Path $here "..")).Path
}

$repoRoot = Resolve-RepoRoot
$backendDir = Join-Path $repoRoot "dev\backend"
$mobileDir = Join-Path $repoRoot "dev\mobile"

Write-Host "Repo: $repoRoot" -ForegroundColor Cyan

if (-not (Test-Path $mobileDir)) { throw "Mobile dir not found: $mobileDir" }

if (-not (Test-Path $backendDir)) { throw "Backend dir not found: $backendDir" }

Write-Host "1) Backend build + test + lint" -ForegroundColor Yellow
Push-Location $backendDir
try {
  npm run build
  npm run test
  npx eslint "{src,apps,libs,test}/**/*.ts"
} finally {
  Pop-Location
}

Write-Host "2) Mobile typecheck" -ForegroundColor Yellow
Push-Location $mobileDir
try {
  npm run typecheck
} finally {
  Pop-Location
}

Write-Host "Done. M5.2 verification completed." -ForegroundColor Green
