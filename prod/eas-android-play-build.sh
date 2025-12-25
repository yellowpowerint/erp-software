#!/bin/bash

set -e

repoRoot="$(cd "$(dirname "$0")/.." && pwd)"
mobileDir="$repoRoot/dev/mobile"

echo "Repo: $repoRoot"

(
  cd "$mobileDir"
  npm run validate:release
  npx eas build --platform android --profile production
)
