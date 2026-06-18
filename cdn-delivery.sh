#!/bin/bash
# ==============================================================================
# jsDelivr CDN Delivery Script for ibira.js
# ==============================================================================
# This script generates jsDelivr CDN URLs for delivering ibira.js from GitHub
# Reference: https://www.jsdelivr.com/?docs=gh
# ==============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/scripts/colors.sh"

# ── Log helpers ───────────────────────────────────────────────────────────────
section() { echo -e "${YELLOW}$*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
info()    { echo -e "${GREEN}$*${NC}"; }
warn()    { echo -e "${RED}⚠️  $*${NC}"; }

print_header() {
	echo -e "${BLUE}╔═════════════════════════════════════════════════════════════╗${NC}"
	echo -e "${BLUE}║         jsDelivr CDN URLs for ibira.js                     ║${NC}"
	echo -e "${BLUE}╚═════════════════════════════════════════════════════════════╝${NC}"
}

print_footer() {
	echo -e "${BLUE}╔═════════════════════════════════════════════════════════════╗${NC}"
	echo -e "${BLUE}║  For more information visit: https://www.jsdelivr.com/     ║${NC}"
	echo -e "${BLUE}╚═════════════════════════════════════════════════════════════╝${NC}"
}

# ── Project configuration ─────────────────────────────────────────────────────
GITHUB_USER="mpbarbosa"
GITHUB_REPO="ibira.js"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
[[ -n "${PACKAGE_VERSION}" ]] || { echo "Error: could not determine package version from package.json" >&2; exit 1; }
VERSION_RANGE=$(node -p "require('./package.json').version.match(/^\\d+\\.\\d+/)[0]")
[[ -n "${VERSION_RANGE}" ]] || { echo "Error: could not determine version range from package.json" >&2; exit 1; }
MAIN_FILE="dist/index.mjs"

print_header
echo ""
info "Repository: ${GITHUB_USER}/${GITHUB_REPO}"
info "Version: ${PACKAGE_VERSION}"
echo ""

# ==============================================================================
# 1. Load specific version
# ==============================================================================
section "📦 Version-Specific URLs:"
echo ""
echo "Load a specific version (recommended for production):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}"
echo ""
echo "Load entire dist directory (specific version):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/"
echo ""

# ==============================================================================
# 2. Load from specific commit
# ==============================================================================
LATEST_COMMIT=$(git rev-parse HEAD)
[[ -n "${LATEST_COMMIT}" ]] || { echo "Error: could not determine current git commit" >&2; exit 1; }
section "🔖 Commit-Specific URL:"
echo ""
echo "Load from specific commit (${LATEST_COMMIT:0:7}):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${LATEST_COMMIT}/${MAIN_FILE}"
echo ""

# ==============================================================================
# 3. Load latest from branch
# ==============================================================================
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[[ -n "${CURRENT_BRANCH}" ]] || { echo "Error: could not determine current git branch" >&2; exit 1; }
section "🌿 Branch URLs:"
echo ""
echo "Load latest from ${CURRENT_BRANCH} branch (auto-updates):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${CURRENT_BRANCH}/${MAIN_FILE}"
echo ""
echo "Load latest from main branch (if main exists):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@main/${MAIN_FILE}"
echo ""

# ==============================================================================
# 4. Load with version ranges
# ==============================================================================
section "🎯 Version Range URLs (SemVer):"
echo ""
echo "Load latest v${VERSION_RANGE}.x (patch updates):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${VERSION_RANGE}/${MAIN_FILE}"
echo ""
echo "Load latest v${VERSION_RANGE%%.*}.x.x (minor updates):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${VERSION_RANGE%%.*}/${MAIN_FILE}"
echo ""

# ==============================================================================
# 5. Minified files (if available)
# ==============================================================================
section "⚡ Optimized URLs:"
echo ""
echo "Auto-minified version (adds .min.mjs automatically):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/index.min.mjs"
echo ""

# ==============================================================================
# 6. Load multiple files (combine)
# ==============================================================================
section "📚 Combine Multiple Files:"
echo ""
echo "Combine and minify multiple files:"
echo "https://cdn.jsdelivr.net/combine/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/index.mjs,gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/index.js"
echo ""

# ==============================================================================
# 7. Load entire package with /npm (if published to npm)
# ==============================================================================
section "📦 NPM CDN URLs (if published):"
echo ""
echo "Load from npm registry:"
echo "https://cdn.jsdelivr.net/npm/ibira.js@${PACKAGE_VERSION}/${MAIN_FILE}"
echo ""
echo "Load latest from npm:"
echo "https://cdn.jsdelivr.net/npm/ibira.js/${MAIN_FILE}"
echo ""

# ==============================================================================
# 8. HTML Usage Examples
# ==============================================================================
section "🌐 HTML Usage Examples:"
echo ""
echo "<!-- Load specific version -->"
echo "<script src=\"https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}\"></script>"
echo ""
echo "<!-- Load with SRI (Subresource Integrity) -->"
echo "<!-- Generate SRI hash at: https://www.srihash.org/ -->"
echo "<script src=\"https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}\""
echo "        integrity=\"sha384-HASH_HERE\""
echo "        crossorigin=\"anonymous\"></script>"
echo ""
echo "<!-- ES Module import -->"
echo "<script type=\"module\">"
echo "  import { IbiraAPIFetcher } from 'https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}';"
echo "</script>"
echo ""

# ==============================================================================
# 9. Additional Features
# ==============================================================================
section "🔧 Additional Features:"
echo ""
echo "Add .map to get source maps:"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}.map"
echo ""
echo "Get package.json:"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/package.json"
echo ""
echo "List all files in the package:"
echo "https://data.jsdelivr.com/v1/package/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}"
echo ""

# ==============================================================================
# 10. Performance Tips
# ==============================================================================
section "⚡ Performance Tips:"
echo ""
echo "1. Always use specific versions in production (not @latest or branch names)"
echo "2. Enable SRI for security and cache validation"
echo "3. jsDelivr automatically serves from 750+ CDN locations worldwide"
echo "4. Files are minified and compressed (Brotli/Gzip) automatically"
echo "5. HTTP/2 and HTTP/3 support for faster loading"
echo ""

# ==============================================================================
# 11. Save URLs to file
# ==============================================================================
OUTPUT_FILE="cdn-urls.txt"
info "💾 Saving URLs to ${OUTPUT_FILE}..."

# bessa_patterns.ts bundled dependency info
BESSA_REPO="bessa_patterns.ts"
BESSA_VERSION=$(node -p "require('./node_modules/bessa_patterns.ts/package.json').version" 2>/dev/null || echo "0.12.3-alpha")

cat > "${OUTPUT_FILE}" << EOF
jsDelivr CDN URLs for ${GITHUB_USER}/${GITHUB_REPO} v${PACKAGE_VERSION}
=============================================================================

PRODUCTION (Recommended - Specific Version):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}

DEVELOPMENT (Latest from branch):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${CURRENT_BRANCH}/${MAIN_FILE}

VERSION RANGE (Auto-update patches):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${VERSION_RANGE}/${MAIN_FILE}

NPM CDN (if published to npm):
https://cdn.jsdelivr.net/npm/ibira.js@${PACKAGE_VERSION}/${MAIN_FILE}

HTML USAGE:
<script src="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}"></script>

ES MODULE:
<script type="module">
  import { IbiraAPIFetcher } from 'https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}';
</script>

PACKAGE INFO API:
https://data.jsdelivr.com/v1/package/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}

=============================================================================

BUNDLED DEPENDENCY — ${BESSA_REPO} v${BESSA_VERSION}
(DualObserverSubject is bundled into the ibira.js dist — no separate load required)
=============================================================================

${BESSA_REPO} CDN (GitHub via jsDelivr):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${BESSA_REPO}@v${BESSA_VERSION}/dist/index.mjs

${BESSA_REPO} CDN (npm via jsDelivr, when published):
https://cdn.jsdelivr.net/npm/${BESSA_REPO}@${BESSA_VERSION}/dist/index.mjs

${BESSA_REPO} GitHub repository:
https://github.com/${GITHUB_USER}/${BESSA_REPO}

=============================================================================
EOF

echo ""
success "URLs saved to ${OUTPUT_FILE}"
echo ""

# ==============================================================================
# 12. Test CDN availability (optional)
# ==============================================================================
if command -v curl &> /dev/null; then
	section "🧪 Testing CDN availability..."
	TEST_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/package.json"

	if curl -s -f -o /dev/null "$TEST_URL"; then
		success "CDN is serving your package!"
		echo -e "   Test URL: ${TEST_URL}"
	else
		warn "Package not yet available on CDN"
		echo -e "   Make sure you have:"
		echo -e "   1. Pushed your code to GitHub"
		echo -e "   2. Created a git tag: git tag v${PACKAGE_VERSION}"
		echo -e "   3. Pushed the tag: git push origin v${PACKAGE_VERSION}"
		echo -e ""
		echo -e "   Or wait a few minutes for jsDelivr to sync from GitHub"
	fi
else
	info "ℹ️  Install curl to test CDN availability"
fi

echo ""
print_footer
