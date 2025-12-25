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
$outDir = Join-Path $repoRoot "prod\submission-m7-2-ios"
$zipPath = Join-Path $repoRoot "prod\submission-m7-2-ios.zip"

if (Test-Path $outDir) {
  Remove-Item -Recurse -Force $outDir
}
New-Item -ItemType Directory -Path $outDir | Out-Null

Set-Content -Path (Join-Path $outDir "README.txt") -Value "M7.2 iOS Submission Package (template)" -Encoding UTF8

Set-Content -Path (Join-Path $outDir "app_store_description_short.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "app_store_description_full.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "keywords.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "support_email.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "support_url.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "privacy_policy_url.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "release_notes_whats_new.txt") -Value "" -Encoding UTF8
Set-Content -Path (Join-Path $outDir "app_review_notes.txt") -Value "" -Encoding UTF8

Set-Content -Path (Join-Path $outDir "screenshots_required.txt") -Value "iPhone: required\n iPad: if supportsTablet=true" -Encoding UTF8

if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}
Compress-Archive -Path (Join-Path $outDir "*") -DestinationPath $zipPath

Write-Host "Created: $outDir" -ForegroundColor Green
Write-Host "Created: $zipPath" -ForegroundColor Green
