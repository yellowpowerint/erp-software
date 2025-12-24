#!/usr/bin/env bash
set -euo pipefail

API_URL="${1:-}"
OUTPUT_DIR="${2:-}"
ZIP_NAME="${3:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MOBILE_DIR="${REPO_ROOT}/dev/mobile"

if [[ ! -d "${MOBILE_DIR}" ]]; then
  echo "Mobile app directory not found: ${MOBILE_DIR}" >&2
  exit 1
fi

if [[ -n "${API_URL}" ]]; then
  export EXPO_PUBLIC_API_URL="${API_URL}"
else
  echo "EXPO_PUBLIC_API_URL not provided. Using existing environment value or app default." >&2
fi

if [[ -z "${OUTPUT_DIR}" ]]; then
  OUTPUT_DIR="${REPO_ROOT}/prod/mobile-export"
fi

if [[ -z "${ZIP_NAME}" ]]; then
  TS="$(date +%Y%m%d-%H%M%S)"
  ZIP_NAME="mobile-export-${TS}.zip"
fi

EXPORT_DIR="${OUTPUT_DIR}/dist"
ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

mkdir -p "${OUTPUT_DIR}"
rm -rf "${EXPORT_DIR}"

echo "Repo: ${REPO_ROOT}"
echo "Mobile: ${MOBILE_DIR}"
echo "Output: ${OUTPUT_DIR}"
echo "Export: ${EXPORT_DIR}"
echo "Zip: ${ZIP_PATH}"

pushd "${MOBILE_DIR}" >/dev/null
npm ci
npm run typecheck
npx expo export --platform all --output-dir "${EXPORT_DIR}"
popd >/dev/null

rm -f "${ZIP_PATH}"

if command -v zip >/dev/null 2>&1; then
  pushd "${EXPORT_DIR}" >/dev/null
  zip -r "${ZIP_PATH}" .
  popd >/dev/null
else
  echo "zip is not available on PATH; please install zip, then re-run." >&2
  exit 1
fi

echo "Done. Created: ${ZIP_PATH}"
