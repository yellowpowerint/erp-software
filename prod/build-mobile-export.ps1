param(
  [string]$ApiUrl = "",
  [string]$OutputDir = "",
  [string]$ZipName = ""
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  $here = Split-Path -Parent $MyInvocation.MyCommand.Path
  return (Resolve-Path (Join-Path $here "..")).Path
}

$repoRoot = Resolve-RepoRoot
$mobileDir = Join-Path $repoRoot "dev\mobile"

if (-not (Test-Path $mobileDir)) {
  throw "Mobile app directory not found: $mobileDir"
}

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
  Write-Host "EXPO_PUBLIC_API_URL not provided. Using existing environment value or app default." -ForegroundColor Yellow
} else {
  $Env:EXPO_PUBLIC_API_URL = $ApiUrl
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $repoRoot "prod\mobile-export"
}

if ([string]::IsNullOrWhiteSpace($ZipName)) {
  $ts = Get-Date -Format "yyyyMMdd-HHmmss"
  $ZipName = "mobile-export-$ts.zip"
}

$exportDir = Join-Path $OutputDir "dist"
$zipPath = Join-Path $OutputDir $ZipName

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
if (Test-Path $exportDir) {
  Remove-Item -Recurse -Force $exportDir
}

Write-Host "Repo: $repoRoot"
Write-Host "Mobile: $mobileDir"
Write-Host "Output: $OutputDir"
Write-Host "Export: $exportDir"
Write-Host "Zip: $zipPath"

Push-Location $mobileDir
try {
  Write-Host "Installing dependencies (npm ci)..."
  npm ci

  Write-Host "Type-checking..."
  npm run typecheck

  Write-Host "Exporting Expo bundle..."
  npx expo export --platform all --output-dir $exportDir
} finally {
  Pop-Location
}

if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}

Compress-Archive -Path (Join-Path $exportDir "*") -DestinationPath $zipPath
Write-Host "Done. Created: $zipPath" -ForegroundColor Green
