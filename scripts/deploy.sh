#!/usr/bin/env bash
# scripts/deploy.sh
# Build, test, tag, push to GitHub, and regenerate CDN URLs for ibira.js.
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

# ── Colors ────────────────────────────────────────────────────────────────────
# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"

info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✓  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✗  $*${NC}" >&2; }

# ── Resolve project root ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

# ── Resolve version ────────────────────────────────────────────────────────────
VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
	VERSION="$(node -e "process.stdout.write(require('./package.json').version)")"
fi

TAG="v${VERSION}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ibira.js  ·  Deploy to CDN            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${REPO_ROOT}"
info "Version      : ${VERSION}"
info "Git tag      : ${TAG}"
echo ""

# ── Guard: clean working tree ──────────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
	error "Working tree is dirty. Commit or stash your changes first."
	exit 1
fi

# ── Guard: tag must not already exist ─────────────────────────────────────────
if git rev-parse "${TAG}" >/dev/null 2>&1; then
	error "Tag ${TAG} already exists. Bump the version before deploying."
	exit 3
fi

# ── Step 1/4: Build ───────────────────────────────────────────────────────────
info "Step 1/4 — Building …"
npm run build
success "Build complete"
echo ""

# ── Step 2/4: Run tests ───────────────────────────────────────────────────────
info "Step 2/4 — Running tests …"
if ! npm test --silent; then
	error "Tests failed. Fix failing tests before deploying."
	exit 2
fi
success "All tests passed"
echo ""

# ── Step 3/4: Commit build artifacts ─────────────────────────────────────────
info "Step 3/4 — Committing build artifacts …"
git add dist/ cdn-delivery.sh 2>/dev/null || true

if git diff --cached --quiet; then
	warn "Nothing to commit — build artifacts are up to date"
else
	git commit -m "chore: build artifacts for ${TAG}"
	success "Committed build artifacts"
fi
echo ""

# ── Step 4/4: Tag & push ──────────────────────────────────────────────────────
info "Step 4/4 — Tagging and pushing …"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
	error "Could not determine current git branch (detached HEAD?)."
	exit 1
fi

# Pull latest remote changes before pushing to avoid non-fast-forward rejection
git pull --rebase origin "${CURRENT_BRANCH}"

git tag -a "${TAG}" -m "Release ${TAG}"
success "Created tag ${TAG}"

if ! git push origin "${CURRENT_BRANCH}" --tags; then
	error "Push failed."
	exit 4
fi
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── Generate CDN URLs ─────────────────────────────────────────────────────────
if [[ -f "${REPO_ROOT}/cdn-delivery.sh" ]]; then
	info "Regenerating CDN URLs …"
	bash "${REPO_ROOT}/cdn-delivery.sh"
	success "cdn-urls.txt updated"
else
	warn "cdn-delivery.sh not found — skipping CDN URL regeneration"
fi

echo ""
success "Deployment of ${TAG} complete! 🚀"
echo "    CDN will pick up the new tag automatically via jsDelivr within a few minutes."
echo ""
