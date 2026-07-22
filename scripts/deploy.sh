#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for ibira.js
# ==============================================================================
# Builds the library, runs tests, commits the compiled artifacts, creates a
# version tag, pushes to GitHub, publishes to npm, and generates jsDelivr CDN
# URLs.
#
# Usage:
#   export NPM_TOKEN=npm_...      # or place NPM_TOKEN=npm_... in ./.env
#   bash scripts/deploy.sh [version]
#   ai-workflow deploy            # via .workflow-config.yaml deploy command
#
#   If [version] is omitted the version from package.json is used.
#
# Guards:
#   NPM_TOKEN must be set (via environment or ./.env); working tree must be
#   clean; tests must pass; build must succeed.
#
# PRE-FLIGHT — verify NPM_TOKEN *before* deploying:
#   This script fails fast (exit 1) if NPM_TOKEN is missing, but that guard runs
#   only once deploy starts. In a release pipeline where earlier steps
#   (version-bump, commit, push) run *before* this script, a missing token
#   leaves `main` bumped and pushed with NO matching git tag and NO npm publish
#   — i.e. main is ahead of the last real release. To avoid that drift, confirm
#   the token is present up front, before the pipeline bumps the version:
#     [[ -n "${NPM_TOKEN:-}" ]] || grep -q '^NPM_TOKEN=' ./.env || \
#       { echo "Set NPM_TOKEN before releasing"; exit 1; }
#   Gate the bump/push steps behind that check (or behind a successful deploy)
#   so a token problem never advances the version.
#
# Exit codes:
#   0 — success
#   1 — git working tree is dirty (or detached HEAD), or NPM_TOKEN missing
#   2 — tests failed
#   4 — push failed
#   5 — npm publish failed
# ==============================================================================

set -euo pipefail

# ── Cleanup ─────────────────────────────────────────────────────────────────
# Always remove the ephemeral .npmrc (holds the auth token) on exit.
cleanup() {
	rm -f "${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/.npmrc"
}
trap cleanup EXIT

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

# ── Load .env ─────────────────────────────────────────────────────────────────
# Fills NPM_TOKEN (and any other vars) from the project's .env file when they are
# not already present in the environment. An explicit `export NPM_TOKEN=...` takes
# precedence over the file. The .env file is gitignored — never commit it.
ENV_FILE="${PROJECT_ROOT}/.env"
if [[ -z "${NPM_TOKEN:-}" && -f "${ENV_FILE}" ]]; then
	set -a
	# shellcheck disable=SC1090
	source "${ENV_FILE}"
	set +a
	info "Loaded NPM_TOKEN from .env"
fi

# ── Guard: NPM_TOKEN required ──────────────────────────────────────────────────
if [[ -z "${NPM_TOKEN:-}" ]]; then
	error "NPM_TOKEN is not set."
	info  "To fix this, create an Automation token on npm:"
	info  "  1. Go to https://www.npmjs.com/settings/~/tokens"
	info  "  2. Generate New Token → Granular Access Token"
	info  "  3. Enable 'Bypass 2FA' and set permission to 'Read and write'"
	info  "  4. export NPM_TOKEN=npm_... && bash scripts/deploy.sh"
	info  "     (or add NPM_TOKEN=npm_... to ./.env)"
	exit 1
fi

command -v npm >/dev/null 2>&1 || { error "npm not found on PATH."; exit 1; }

# ── Resolve version ────────────────────────────────────────────────────────────
VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
	VERSION="$(node -p "require('./package.json').version")"
fi

PACKAGE_NAME="$(node -p "require('./package.json').name")"
# Derive the npm dist-tag: a prerelease like 1.2.3-alpha.1 publishes under
# `alpha`; a stable version publishes under `latest`.
PRERELEASE="$(node -p "('${VERSION}'.match(/-([A-Za-z]+)/)||[])[1]||''")"
NPM_TAG="${PRERELEASE:-latest}"
TAG="v${VERSION}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ibira.js  ·  Deploy to npm + CDN      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Version      : ${VERSION}"
info "npm dist-tag : ${NPM_TAG}"
info "Git tag      : ${TAG}"
echo ""

# ── Guard: clean working tree ──────────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
	error "Working tree is dirty. Commit or stash your changes first."
	exit 1
fi

# ── Step 1/7: Build (only if needed) ─────────────────────────────────────────
BUILD_SENTINEL="dist/index.js"
BUILD_NEEDED=false

if [[ ! -f "${BUILD_SENTINEL}" ]]; then
	BUILD_NEEDED=true
elif find src tsup.config.ts package.json tsconfig.json \
		-newer "${BUILD_SENTINEL}" -print -quit 2>/dev/null | grep -q .; then
	BUILD_NEEDED=true
fi

if [[ "${BUILD_NEEDED}" == "true" ]]; then
	info "Step 1/7 — Building …"
	npm run build
	success "Build complete"
else
	success "Step 1/7 — Build artifacts are up to date, skipping"
fi
echo ""

# ── Step 2/7: Run tests ───────────────────────────────────────────────────────
info "Step 2/7 — Running tests …"
if ! npm test --silent; then
	error "Tests failed. Fix failing tests before deploying."
	exit 2
fi
success "All tests passed"
echo ""

# ── Step 3/7: Commit build artifacts ─────────────────────────────────────────
info "Step 3/7 — Committing build artifacts …"

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

# ── Step 4/7: Tag & push ──────────────────────────────────────────────────────
info "Step 4/7 — Tagging and pushing …"

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

# ── Step 5/7: Publish to npm ──────────────────────────────────────────────────
info "Step 5/7 — Publishing ${PACKAGE_NAME}@${VERSION} to npm (tag: ${NPM_TAG}) …"

# Abort early if this exact version is already on the registry — npm would
# reject it anyway, and this gives a clearer message.
if npm view "${PACKAGE_NAME}@${VERSION}" version >/dev/null 2>&1; then
	warn "${PACKAGE_NAME}@${VERSION} is already published on npm — skipping publish"
else
	# Write an ephemeral, token-scoped .npmrc (removed by the cleanup trap).
	echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "${PROJECT_ROOT}/.npmrc"

	set +e
	PUBLISH_OUTPUT="$(npm publish --access public --tag "${NPM_TAG}" 2>&1)"
	PUBLISH_EXIT=$?
	set -e
	echo "${PUBLISH_OUTPUT}"

	if [[ ${PUBLISH_EXIT} -ne 0 ]]; then
		if echo "${PUBLISH_OUTPUT}" | grep -qi "Two-factor authentication\|bypass 2fa\|EOTP\|one-time password"; then
			error "npm publish failed: 2FA bypass required (npm demanded a one-time password)."
			info  "Your NPM_TOKEN can't publish non-interactively because 2FA is enabled for publishing."
			info  "Fix: create a token that bypasses 2FA at https://www.npmjs.com/settings/~/tokens"
			info  "  → Granular Access Token → enable 'Bypass 2FA' → Read and write (or a classic Automation token)"
		elif echo "${PUBLISH_OUTPUT}" | grep -qi "403\|Forbidden\|credentials"; then
			error "npm publish failed: invalid or expired token."
			info  "Verify NPM_TOKEN is a valid Automation token with publish rights."
			info  "  https://www.npmjs.com/settings/~/tokens"
		elif echo "${PUBLISH_OUTPUT}" | grep -qi "404\|not found"; then
			error "npm publish failed: registry or package not found."
			info  "Check the package name in package.json and the registry URL."
		else
			error "npm publish failed (exit ${PUBLISH_EXIT})."
		fi
		exit 5
	fi
	success "Published ${PACKAGE_NAME}@${VERSION} to npm (tag: ${NPM_TAG})"
fi
echo ""

# ── Step 6/7: Show CDN URLs ───────────────────────────────────────────────────
info "Step 6/7 — CDN URLs (from cdn-urls.txt committed in step 3) …"
if [[ -f "${PROJECT_ROOT}/cdn-urls.txt" ]]; then
	cat "${PROJECT_ROOT}/cdn-urls.txt"
else
	warn "cdn-urls.txt not found"
fi
echo ""
info "npm-backed jsDelivr URLs for ${PACKAGE_NAME}@${VERSION}:"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${NPM_TAG}/dist/index.mjs"
echo "    https://cdn.jsdelivr.net/npm/${PACKAGE_NAME}@${VERSION}/dist/index.mjs"
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo "    CDN will pick up the new tag automatically via jsDelivr within a few minutes."
echo ""

# ── Step 7/7: CDN availability check ─────────────────────────────────────────
info "Step 7/7 — Checking CDN availability for ${TAG} …"

GITHUB_USER="$(git remote get-url origin | sed -E 's|.*[:/]([^/]+)/[^/]+$|\1|; s|\.git$||')"
GITHUB_REPO="$(basename "$(git remote get-url origin)" .git)"
CDN_IBIRA_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${TAG}/dist/index.mjs"

BESSA_VERSION="$(node -p "require('./node_modules/bessa_patterns.ts/package.json').version" 2>/dev/null || true)"
CDN_BESSA_URL=""
[[ -n "${BESSA_VERSION}" ]] && CDN_BESSA_URL="https://cdn.jsdelivr.net/npm/bessa_patterns.ts@${BESSA_VERSION}/dist/index.mjs"

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
