#!/bin/bash

set -e

repoRoot="$(cd "$(dirname "$0")/.." && pwd)"
mobileDir="$repoRoot/dev/mobile"

echo "Repo: $repoRoot"

(
  cd "$mobileDir"
  npx eas submit --platform ios --profile production --latest
)
