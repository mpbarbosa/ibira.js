#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for ibira.js
# ==============================================================================
# Builds the library, runs tests, commits the compiled artifacts, creates a
# version tag, pushes to GitHub, and generates jsDelivr CDN URLs.
#
# Usage:
#   bash scripts/deploy.sh [version]
#   ai-workflow deploy          # via .workflow-config.yaml deploy command
#
#   If [version] is omitted the version from package.json is used.
#
# Exit codes:
#   0 — success
#   1 — git working tree is dirty (or detached HEAD)
#   2 — tests failed
#   4 — push failed
# ==============================================================================

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
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# ── Resolve version ────────────────────────────────────────────────────────────
VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
	VERSION="$(node -p "require('./package.json').version")"
fi

TAG="v${VERSION}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ibira.js  ·  Deploy to CDN            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Version      : ${VERSION}"
info "Git tag      : ${TAG}"
echo ""

# ── Guard: clean working tree ──────────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
	error "Working tree is dirty. Commit or stash your changes first."
	exit 1
fi

# ── Step 1/5: Build (only if needed) ─────────────────────────────────────────
BUILD_SENTINEL="dist/index.js"
BUILD_NEEDED=false

if [[ ! -f "${BUILD_SENTINEL}" ]]; then
	BUILD_NEEDED=true
elif find src tsup.config.ts package.json tsconfig.json \
		-newer "${BUILD_SENTINEL}" -print -quit 2>/dev/null | grep -q .; then
	BUILD_NEEDED=true
fi

if [[ "${BUILD_NEEDED}" == "true" ]]; then
	info "Step 1/5 — Building …"
	npm run build
	success "Build complete"
else
	success "Step 1/5 — Build artifacts are up to date, skipping"
fi
echo ""

# ── Step 2/5: Run tests ───────────────────────────────────────────────────────
info "Step 2/5 — Running tests …"
if ! npm test --silent; then
	error "Tests failed. Fix failing tests before deploying."
	exit 2
fi
success "All tests passed"
echo ""

# ── Step 3/5: Commit build artifacts ─────────────────────────────────────────
info "Step 3/5 — Committing build artifacts …"
git add dist/ cdn-delivery.sh 2>/dev/null || true

if git diff --cached --quiet; then
	warn "Nothing to commit — build artifacts are up to date"
else
	git commit -m "chore: build artifacts for ${TAG}"
	success "Committed build artifacts"
fi
echo ""

# ── Step 4/5: Tag & push ──────────────────────────────────────────────────────
info "Step 4/5 — Tagging and pushing …"

# Detect current branch dynamically (avoids hardcoding 'main')
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
	error "Could not determine current git branch (detached HEAD?)."
	exit 1
fi

# Pull latest remote changes before pushing to avoid non-fast-forward rejection
git pull --rebase origin "${CURRENT_BRANCH}"

# Create annotated tag (skip gracefully if it already exists)
if git rev-parse "${TAG}" >/dev/null 2>&1; then
	warn "Tag ${TAG} already exists — skipping tag creation"
else
	git tag -a "${TAG}" -m "Release ${TAG}"
	success "Created tag ${TAG}"
fi

if ! git push origin "${CURRENT_BRANCH}" --tags; then
	error "Push failed."
	exit 4
fi
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── Step 5/5: Generate CDN URLs ───────────────────────────────────────────────
info "Step 5/5 — Generating jsDelivr CDN URLs …"
if [[ -f "${PROJECT_ROOT}/cdn-delivery.sh" ]]; then
	bash "${PROJECT_ROOT}/cdn-delivery.sh"
	success "cdn-urls.txt updated"
else
	warn "cdn-delivery.sh not found — skipping CDN URL regeneration"
fi
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo "    CDN will pick up the new tag automatically via jsDelivr within a few minutes."
echo ""

