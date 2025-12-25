#!/bin/bash

set -e

repoRoot="$(cd "$(dirname "$0")/.." && pwd)"
outDir="$repoRoot/prod/submission-m7-2-ios"
zipPath="$repoRoot/prod/submission-m7-2-ios.zip"

if ! command -v zip >/dev/null 2>&1; then
  echo "zip command not found. Install zip (e.g. apt-get install zip) or run the PowerShell packaging script instead." >&2
  exit 1
fi

rm -rf "$outDir"
mkdir -p "$outDir"

echo "M7.2 iOS Submission Package (template)" > "$outDir/README.txt"

: > "$outDir/app_store_description_short.txt"
: > "$outDir/app_store_description_full.txt"
: > "$outDir/keywords.txt"
: > "$outDir/support_email.txt"
: > "$outDir/support_url.txt"
: > "$outDir/privacy_policy_url.txt"
: > "$outDir/release_notes_whats_new.txt"
: > "$outDir/app_review_notes.txt"

echo -e "iPhone: required\n iPad: if supportsTablet=true" > "$outDir/screenshots_required.txt"

rm -f "$zipPath"
(
  cd "$outDir"
  zip -r "$zipPath" .
)

echo "Created: $outDir"
echo "Created: $zipPath"
