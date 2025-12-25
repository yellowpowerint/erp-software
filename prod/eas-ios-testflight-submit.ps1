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
  npx eas submit --platform ios --profile production --latest
} finally {
  Pop-Location
}
