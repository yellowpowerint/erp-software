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
$mobileDir = Join-Path $repoRoot "dev\mobile"

Write-Host "Repo: $repoRoot" -ForegroundColor Cyan

Push-Location $mobileDir
try {
  npm run validate:release
  npx eas build --platform ios --profile production
} finally {
  Pop-Location
}
