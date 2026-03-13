#!/bin/bash
# ==============================================================================
# jsDelivr CDN Delivery Script for ibira.js
# ==============================================================================
# This script generates jsDelivr CDN URLs for delivering ibira.js from GitHub
# Reference: https://www.jsdelivr.com/?docs=gh
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
GITHUB_USER="mpbarbosa"
GITHUB_REPO="ibira.js"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
[[ -n "${PACKAGE_VERSION}" ]] || { echo "Error: could not determine package version from package.json" >&2; exit 1; }
VERSION_RANGE=$(node -p "require('./package.json').version.match(/^\\d+\\.\\d+/)[0]")
[[ -n "${VERSION_RANGE}" ]] || { echo "Error: could not determine version range from package.json" >&2; exit 1; }
MAIN_FILE="dist/index.mjs"

echo -e "${BLUE}\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557${NC}"
echo -e "${BLUE}\u2551         jsDelivr CDN URLs for ibira.js                     \u2551${NC}"
echo -e "${BLUE}\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d${NC}"
echo ""
echo -e "${GREEN}Repository:${NC} ${GITHUB_USER}/${GITHUB_REPO}"
echo -e "${GREEN}Version:${NC} ${PACKAGE_VERSION}"
echo ""

# ==============================================================================
# 1. Load specific version
# ==============================================================================
echo -e "${YELLOW}\U0001F4E6 Version-Specific URLs:${NC}"
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
echo -e "${YELLOW}\U0001F516 Commit-Specific URL:${NC}"
echo ""
echo "Load from specific commit (${LATEST_COMMIT:0:7}):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${LATEST_COMMIT}/${MAIN_FILE}"
echo ""

# ==============================================================================
# 3. Load latest from branch
# ==============================================================================
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[[ -n "${CURRENT_BRANCH}" ]] || { echo "Error: could not determine current git branch" >&2; exit 1; }
echo -e "${YELLOW}\U0001F33F Branch URLs:${NC}"
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
echo -e "${YELLOW}\U0001F3AF Version Range URLs (SemVer):${NC}"
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
echo -e "${YELLOW}\u26A1 Optimized URLs:${NC}"
echo ""
echo "Auto-minified version (adds .min.mjs automatically):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/index.min.mjs"
echo ""

# ==============================================================================
# 6. Load multiple files (combine)
# ==============================================================================
echo -e "${YELLOW}\U0001F4DA Combine Multiple Files:${NC}"
echo ""
echo "Combine and minify multiple files:"
echo "https://cdn.jsdelivr.net/combine/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/index.mjs,gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/index.js"
echo ""

# ==============================================================================
# 7. Load entire package with /npm (if published to npm)
# ==============================================================================
echo -e "${YELLOW}\U0001F4E6 NPM CDN URLs (if published):${NC}"
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
echo -e "${YELLOW}\U0001F310 HTML Usage Examples:${NC}"
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
echo -e "${YELLOW}\U0001F527 Additional Features:${NC}"
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
echo -e "${YELLOW}\u26A1 Performance Tips:${NC}"
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
echo -e "${GREEN}\U0001F4BE Saving URLs to ${OUTPUT_FILE}...${NC}"

cat > "${OUTPUT_FILE}" << EOF
jsDelivr CDN URLs for ${GITHUB_USER}/${GITHUB_REPO} v${PACKAGE_VERSION}
Generated: $(date)
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
EOF

echo ""
echo -e "${GREEN}\u2705 URLs saved to ${OUTPUT_FILE}${NC}"
echo ""

# ==============================================================================
# 12. Test CDN availability (optional)
# ==============================================================================
if command -v curl &> /dev/null; then
    echo -e "${YELLOW}\U0001F9EA Testing CDN availability...${NC}"
    TEST_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/package.json"

    if curl -s -f -o /dev/null "$TEST_URL"; then
        echo -e "${GREEN}\u2705 CDN is serving your package!${NC}"
        echo -e "   Test URL: ${TEST_URL}"
    else
        echo -e "${RED}\u26A0\uFE0F  Package not yet available on CDN${NC}"
        echo -e "   Make sure you have:"
        echo -e "   1. Pushed your code to GitHub"
        echo -e "   2. Created a git tag: git tag v${PACKAGE_VERSION}"
        echo -e "   3. Pushed the tag: git push origin v${PACKAGE_VERSION}"
        echo -e ""
        echo -e "   Or wait a few minutes for jsDelivr to sync from GitHub"
    fi
else
    echo -e "${YELLOW}\u2139\uFE0F  Install curl to test CDN availability${NC}"
fi

echo ""
echo -e "${BLUE}\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557${NC}"
echo -e "${BLUE}\u2551  For more information visit: https://www.jsdelivr.com/    \u2551${NC}"
echo -e "${BLUE}\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d${NC}"
