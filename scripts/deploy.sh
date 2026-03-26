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

# ── Step 1/6: Build (only if needed) ─────────────────────────────────────────
BUILD_SENTINEL="dist/index.js"
BUILD_NEEDED=false

if [[ ! -f "${BUILD_SENTINEL}" ]]; then
	BUILD_NEEDED=true
elif find src tsup.config.ts package.json tsconfig.json \
		-newer "${BUILD_SENTINEL}" -print -quit 2>/dev/null | grep -q .; then
	BUILD_NEEDED=true
fi

if [[ "${BUILD_NEEDED}" == "true" ]]; then
	info "Step 1/6 — Building …"
	npm run build
	success "Build complete"
else
	success "Step 1/6 — Build artifacts are up to date, skipping"
fi
echo ""

# ── Step 2/6: Run tests ───────────────────────────────────────────────────────
info "Step 2/6 — Running tests …"
if ! npm test --silent; then
	error "Tests failed. Fix failing tests before deploying."
	exit 2
fi
success "All tests passed"
echo ""

# ── Step 3/6: Commit build artifacts ─────────────────────────────────────────
info "Step 3/6 — Committing build artifacts …"

# Regenerate cdn-urls.txt now so it is included in this commit
bash "${PROJECT_ROOT}/cdn-delivery.sh" > /dev/null 2>&1 || true

# Force-add dist/ to bypass .gitignore — gitignored during local development
# but must be committed at release time so jsDelivr can serve it from GitHub.
git add -f dist/ cdn-delivery.sh cdn-urls.txt 2>/dev/null || true

if git diff --cached --quiet; then
	warn "Nothing to commit — build artifacts are up to date"
else
	git commit -m "chore: build artifacts for ${TAG}"
	success "Committed build artifacts"
fi
echo ""

# ── Step 4/6: Tag & push ──────────────────────────────────────────────────────
info "Step 4/6 — Tagging and pushing …"

# Detect current branch dynamically (avoids hardcoding 'main')
CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
	error "Could not determine current git branch (detached HEAD?)."
	exit 1
fi

# Pull latest remote changes before pushing to avoid non-fast-forward rejection
git pull --rebase origin "${CURRENT_BRANCH}"

# Create or move lightweight tag to the current HEAD commit.
# NOTE: jsDelivr cannot dereference annotated tag objects (type "tag" in
# GitHub API); it requires lightweight tags (type "commit") to resolve files.
if git rev-parse "${TAG}" >/dev/null 2>&1; then
	EXISTING_TAG_SHA="$(git rev-parse "${TAG}^{commit}")"
	HEAD_SHA="$(git rev-parse HEAD)"
	if [[ "${EXISTING_TAG_SHA}" == "${HEAD_SHA}" ]]; then
		warn "Tag ${TAG} already points to HEAD — skipping tag creation"
	else
		warn "Tag ${TAG} exists but points to ${EXISTING_TAG_SHA:0:7}, not HEAD (${HEAD_SHA:0:7}) — moving tag"
		git tag -d "${TAG}"
		git push origin ":refs/tags/${TAG}" 2>/dev/null || true
		git tag "${TAG}"
		success "Moved tag ${TAG} to HEAD"
	fi
else
	git tag "${TAG}"
	success "Created tag ${TAG}"
fi

if ! git push origin "${CURRENT_BRANCH}" --tags; then
	error "Push failed."
	exit 4
fi
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── Step 5/6: Show CDN URLs ───────────────────────────────────────────────────
info "Step 5/6 — CDN URLs (from cdn-urls.txt committed in step 3) …"
if [[ -f "${PROJECT_ROOT}/cdn-urls.txt" ]]; then
	cat "${PROJECT_ROOT}/cdn-urls.txt"
else
	warn "cdn-urls.txt not found"
fi
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo "    CDN will pick up the new tag automatically via jsDelivr within a few minutes."
echo ""

# ── Step 6/6: CDN availability check ─────────────────────────────────────────
info "Step 6/6 — Checking CDN availability for ${TAG} …"

GITHUB_USER="$(git remote get-url origin | sed -E 's|.*[:/]([^/]+)/[^/]+$|\1|; s|\.git$||')"
GITHUB_REPO="$(basename "$(git remote get-url origin)" .git)"
CDN_IBIRA_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${TAG}/dist/index.mjs"

BESSA_VERSION="$(node -p "require('./node_modules/bessa_patterns.ts/package.json').version" 2>/dev/null || true)"
CDN_BESSA_URL=""
[[ -n "${BESSA_VERSION}" ]] && CDN_BESSA_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/bessa_patterns.ts@v${BESSA_VERSION}/dist/index.mjs"

_cdn_purge() {
	local url="$1"
	# Purge path: swap cdn.jsdelivr.net for purge.jsdelivr.net
	local purge_url="${url/cdn.jsdelivr.net/purge.jsdelivr.net}"
	curl -s -o /dev/null --max-time 10 "${purge_url}" || true
}

# Verify content exists on raw GitHub (independent of jsDelivr indexing lag).
# Returns 0 if the file is reachable on GitHub, 1 otherwise.
_github_raw_check() {
	local gh_user="$1" gh_repo="$2" git_tag="$3" rel_path="$4"
	local raw_url="https://raw.githubusercontent.com/${gh_user}/${gh_repo}/${git_tag}/${rel_path}"
	curl -s -f -o /dev/null --max-time 10 "${raw_url}"
}

_cdn_check() {
	local label="$1" url="$2" max_retries=5 interval=30
	# Trigger jsDelivr cache purge before polling to speed up propagation
	_cdn_purge "${url}"
	for ((attempt=1; attempt<=max_retries; attempt++)); do
		if curl -s -f -o /dev/null --max-time 10 "${url}"; then
			success "${label} is live on jsDelivr ✓"
			echo "    ${url}"
			return 0
		fi
		if [[ ${attempt} -lt ${max_retries} ]]; then
			warn "${label}: not ready yet (attempt ${attempt}/${max_retries}) — retrying in ${interval}s …"
			sleep "${interval}"
		fi
	done
	warn "${label}: not yet available on CDN after ${max_retries} attempts."
	echo "    Check manually: ${url}"
	# CDN propagation delay is normal — do not fail the deployment
	return 0
}

if command -v curl &>/dev/null; then
	# Confirm the build artifact exists on GitHub before polling jsDelivr
	if _github_raw_check "${GITHUB_USER}" "${GITHUB_REPO}" "${TAG}" "dist/index.mjs"; then
		success "dist/index.mjs is committed and visible on GitHub ✓"
	else
		warn "dist/index.mjs not found on GitHub — CDN delivery will fail"
	fi
	_cdn_check "ibira.js ${TAG}" "${CDN_IBIRA_URL}" || true
	[[ -n "${CDN_BESSA_URL}" ]] && { _cdn_check "bessa_patterns.ts v${BESSA_VERSION}" "${CDN_BESSA_URL}" || true; }
else
	warn "curl not found — skipping CDN check"
	echo "    Verify manually: ${CDN_IBIRA_URL}"
fi
echo ""

