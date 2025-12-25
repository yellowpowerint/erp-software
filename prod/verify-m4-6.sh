#!/bin/bash
# Verify M4.6 - HR Leave Requests (Submit) (Bash)

set -e

repoRoot="$(cd "$(dirname "$0")/.." && pwd)"
backendDir="$repoRoot/dev/backend"
mobileDir="$repoRoot/dev/mobile"

echo "Repo: $repoRoot"

if [ ! -d "$backendDir" ]; then
  echo "Backend dir not found: $backendDir" >&2
  exit 1
fi

if [ ! -d "$mobileDir" ]; then
  echo "Mobile dir not found: $mobileDir" >&2
  exit 1
fi

echo "1) Backend build + test + lint"
(
  cd "$backendDir"
  npm run build
  npm run test
  npx eslint "{src,apps,libs,test}/**/*.ts"
)

echo "2) Mobile typecheck"
(
  cd "$mobileDir"
  npm run typecheck
)

echo "Done. M4.6 verification completed."
