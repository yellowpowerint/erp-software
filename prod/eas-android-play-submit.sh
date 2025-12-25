#!/bin/bash

set -e

track="${1:-internal}"

case "$track" in
  internal) profile="androidInternal" ;;
  alpha) profile="androidAlpha" ;;
  beta) profile="androidBeta" ;;
  production) profile="androidProduction" ;;
  *)
    echo "Invalid track: $track (expected internal|alpha|beta|production)" >&2
    exit 1
    ;;
 esac

repoRoot="$(cd "$(dirname "$0")/.." && pwd)"
mobileDir="$repoRoot/dev/mobile"

echo "Repo: $repoRoot"
echo "Track: $track (profile: $profile)"

(
  cd "$mobileDir"
  npx eas submit --platform android --profile "$profile" --latest
)
