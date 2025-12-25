param(
  [ValidateSet('internal','alpha','beta','production')]
  [string]$Track = 'internal'
)

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

$profile = switch ($Track) {
  'internal' { 'androidInternal' }
  'alpha' { 'androidAlpha' }
  'beta' { 'androidBeta' }
  'production' { 'androidProduction' }
}

Write-Host "Repo: $repoRoot" -ForegroundColor Cyan
Write-Host "Track: $Track (profile: $profile)" -ForegroundColor Yellow

Push-Location $mobileDir
try {
  npx eas submit --platform android --profile $profile --latest
} finally {
  Pop-Location
}
