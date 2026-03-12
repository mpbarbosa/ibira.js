#!/usr/bin/env bash
# scripts/deploy.sh
# Tag a release, push to remote, and regenerate CDN URLs for ibira.js.
#
# Usage:
#   ./scripts/deploy.sh [version]
#
#   If [version] is omitted the version from package.json is used.
#
# Exit codes:
#   0 — success
#   1 — git working tree is dirty
#   2 — tests failed
#   3 — tag already exists
#   4 — push failed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

# ── Resolve version ────────────────────────────────────────────────────────────
VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
	VERSION="$(node -e "process.stdout.write(require('./package.json').version)")"
fi

TAG="v${VERSION}"

echo "🚀  ibira.js deploy — ${TAG}"
echo ""

# ── Guard: clean working tree ──────────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
	echo "❌  Working tree is dirty. Commit or stash your changes first." >&2
	exit 1
fi

# ── Guard: tag must not already exist ─────────────────────────────────────────
if git rev-parse "${TAG}" >/dev/null 2>&1; then
	echo "❌  Tag ${TAG} already exists. Bump the version before deploying." >&2
	exit 3
fi

# ── Run tests ──────────────────────────────────────────────────────────────────
echo "🧪  Running tests…"
if ! npm test --silent; then
	echo "❌  Tests failed. Fix failing tests before deploying." >&2
	exit 2
fi
echo "✅  All tests passed."
echo ""

# ── Create and push tag ────────────────────────────────────────────────────────
echo "🏷   Tagging ${TAG}…"
git tag -a "${TAG}" -m "Release ${TAG}"

echo "📤  Pushing tag to origin…"
if ! git push origin "${TAG}"; then
	echo "❌  Push failed." >&2
	exit 4
fi

# Also push the current branch so the tag is reachable
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push origin "${CURRENT_BRANCH}" || true

echo "✅  Tag pushed."
echo ""

# ── Regenerate CDN URLs ────────────────────────────────────────────────────────
if [[ -f "${REPO_ROOT}/cdn-delivery.sh" ]]; then
	echo "🌐  Regenerating CDN URLs…"
	bash "${REPO_ROOT}/cdn-delivery.sh" "${VERSION}" > "${REPO_ROOT}/cdn-urls.txt"
	echo "✅  cdn-urls.txt updated."
else
	echo "⚠️   cdn-delivery.sh not found — skipping CDN URL regeneration."
fi

echo ""
echo "🎉  Deploy complete: ${TAG}"
echo "    CDN will pick up the new tag automatically via jsDelivr within a few minutes."
