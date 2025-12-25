#!/bin/bash

set -e

repoRoot="$(cd "$(dirname "$0")/.." && pwd)"
outDir="$repoRoot/prod/submission-m7-3-android"
zipPath="$repoRoot/prod/submission-m7-3-android.zip"

if ! command -v zip >/dev/null 2>&1; then
  echo "zip command not found. Install zip or run the PowerShell packaging script instead." >&2
  exit 1
fi

rm -rf "$outDir"
mkdir -p "$outDir"

echo "M7.3 Android Play Store Submission Package (template)" > "$outDir/README.txt"

: > "$outDir/play_store_short_description.txt"
: > "$outDir/play_store_full_description.txt"
: > "$outDir/play_store_whats_new.txt"
: > "$outDir/support_email.txt"
: > "$outDir/support_url.txt"
: > "$outDir/privacy_policy_url.txt"

echo "Fill out Play Console Data safety form based on current app behavior (auth, analytics/monitoring, storage)." > "$outDir/data_safety_notes.txt"
echo "Fill out Play Console Content rating questionnaire; keep answers consistent with app features." > "$outDir/content_rating_notes.txt"
echo "Internal testing -> Closed testing (alpha/beta) -> Production" > "$outDir/testing_tracks_notes.txt"

rm -f "$zipPath"
(
  cd "$outDir"
  zip -r "$zipPath" .
)

echo "Created: $outDir"
echo "Created: $zipPath"
