#!/usr/bin/env bash
# Run all ibira.js test suites inside a Docker container.
# Usage:
#   ./scripts/run-tests-docker.sh              # default Node 22 LTS
#   NODE_VERSION=18 ./scripts/run-tests-docker.sh
#   ./scripts/run-tests-docker.sh --no-cleanup # keep the container image after run

set -euo pipefail

NODE_VERSION="${NODE_VERSION:-22}"
IMAGE="node:${NODE_VERSION}-alpine"
CLEANUP=true
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_WORKDIR="/app"

for arg in "$@"; do
  [[ "$arg" == "--no-cleanup" ]] && CLEANUP=false
done

echo "==> ibira.js Docker test runner"
echo "    Image  : ${IMAGE}"
echo "    Source : ${REPO_ROOT}"
echo ""

# Pull image quietly (only if not cached)
docker image inspect "${IMAGE}" > /dev/null 2>&1 || docker pull "${IMAGE}"

run_suite() {
  local label="$1"; shift
  echo "------------------------------------------------------------"
  echo "  Suite: ${label}"
  echo "------------------------------------------------------------"
  docker run --rm \
    --name "ibira-tests-$(date +%s)" \
    -v "${REPO_ROOT}:${CONTAINER_WORKDIR}:ro" \
    -v "${CONTAINER_WORKDIR}/node_modules" \
    -v "${CONTAINER_WORKDIR}/coverage" \
    -w "${CONTAINER_WORKDIR}" \
    "${IMAGE}" \
    sh -c "npm ci --prefer-offline --silent && $*"
  echo ""
}

# 1. Type-check
run_suite "TypeScript validation" \
  "npm run validate"

# 2. Version consistency
run_suite "Version sync check" \
  "npm run version:check"

# 3. Lint
run_suite "ESLint" \
  "npm run lint"

# 4. jsdom suite (default Jest env — simulates browser)
run_suite "Jest / jsdom environment" \
  "npm test -- --ci --forceExit"

# 5. Node.js suite (same tests, Node runtime)
run_suite "Jest / Node.js environment" \
  "npm run test:node -- --ci --forceExit"

# 6. Coverage gate (jsdom env, enforces ≥75% threshold)
run_suite "Coverage threshold check" \
  "npm run test:coverage -- --ci --forceExit"

echo "============================================================"
echo "  All suites passed."
echo "============================================================"

if $CLEANUP; then
  docker image rm "${IMAGE}" > /dev/null 2>&1 && echo "(image removed)" || true
fi
