# Adaptive Workflow Optimization

**Version:** 0.2.1-alpha  
**Last Updated:** December 31, 2025  
**Purpose:** Workflow optimization strategies and automation improvements for ibira.js

---

## Overview

This document describes adaptive workflow optimizations to improve development efficiency, maintain code quality, and automate routine tasks in the ibira.js project.

## Table of Contents

1. [Immediate Workflow Modifications](#immediate-workflow-modifications)
2. [Cleanup Automation](#cleanup-automation)
3. [Development Workflow Enhancements](#development-workflow-enhancements)
4. [Quality Assurance Automation](#quality-assurance-automation)
5. [Documentation Workflow](#documentation-workflow)
6. [Future Enhancements](#future-enhancements)

---

## Immediate Workflow Modifications

### Step 10: Cleanup Old Artifacts

**Purpose:** Automatically clean up old workflow artifacts and temporary files to prevent repository bloat.

**Configuration:**
```yaml
# .ai_workflow/config.yml
cleanup_old_artifacts:
  condition: dry_run_complete
  action: find .ai_workflow/backlog -mtime +7 -type d -exec rm -rf {} \;
  timing: post_execution
  enabled: true
  retention_days: 7
  directories:
    - .ai_workflow/backlog
    - coverage/lcov-report
    - node_modules/.cache
  description: Remove artifacts older than 7 days
```

**Implementation:**

#### Bash Script: `scripts/cleanup-artifacts.sh`

```bash
#!/bin/bash

# cleanup-artifacts.sh
# Automated cleanup of old workflow artifacts
# Version: 0.2.1-alpha

set -e

# Configuration
RETENTION_DAYS=${RETENTION_DAYS:-7}
DRY_RUN=${DRY_RUN:-false}
VERBOSE=${VERBOSE:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${GREEN}[CLEANUP]${NC} $1"
    fi
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Directories to clean
CLEANUP_DIRS=(
    ".ai_workflow/backlog"
    "coverage/lcov-report"
    "node_modules/.cache"
    ".cache"
)

# Main cleanup function
cleanup_artifacts() {
    local total_removed=0
    local total_size=0

    log "Starting cleanup (retention: ${RETENTION_DAYS} days, dry-run: ${DRY_RUN})"

    for dir in "${CLEANUP_DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            log "Directory not found: $dir (skipping)"
            continue
        fi

        log "Cleaning directory: $dir"

        # Find and process old directories
        while IFS= read -r -d '' item; do
            local size=$(du -sh "$item" 2>/dev/null | cut -f1)
            
            if [ "$DRY_RUN" = true ]; then
                echo "  Would remove: $item ($size)"
            else
                log "  Removing: $item ($size)"
                rm -rf "$item"
            fi
            
            total_removed=$((total_removed + 1))
        done < <(find "$dir" -mtime +${RETENTION_DAYS} -type d -print0 2>/dev/null)

        # Find and process old files
        while IFS= read -r -d '' item; do
            local size=$(du -sh "$item" 2>/dev/null | cut -f1)
            
            if [ "$DRY_RUN" = true ]; then
                echo "  Would remove: $item ($size)"
            else
                log "  Removing: $item ($size)"
                rm -f "$item"
            fi
            
            total_removed=$((total_removed + 1))
        done < <(find "$dir" -mtime +${RETENTION_DAYS} -type f -name "*.log" -o -name "*.tmp" -print0 2>/dev/null)
    done

    # Summary
    if [ "$DRY_RUN" = true ]; then
        echo ""
        echo "Dry-run complete: Would remove $total_removed items"
        echo "Re-run without DRY_RUN=true to actually remove files"
    else
        log "Cleanup complete: Removed $total_removed items"
    fi
}

# Verify we're in repository root
if [ ! -f "package.json" ]; then
    error "Not in repository root. Please run from ibira.js directory."
    exit 1
fi

# Run cleanup
cleanup_artifacts

exit 0
```

**Usage:**

```bash
# Make script executable
chmod +x scripts/cleanup-artifacts.sh

# Dry run (show what would be deleted)
DRY_RUN=true ./scripts/cleanup-artifacts.sh

# Actual cleanup with verbose output
VERBOSE=true ./scripts/cleanup-artifacts.sh

# Custom retention period (10 days)
RETENTION_DAYS=10 ./scripts/cleanup-artifacts.sh
```

**NPM Script Integration:**

Add to `package.json`:
```json
{
  "scripts": {
    "cleanup": "bash scripts/cleanup-artifacts.sh",
    "cleanup:dry-run": "DRY_RUN=true bash scripts/cleanup-artifacts.sh",
    "cleanup:verbose": "VERBOSE=true bash scripts/cleanup-artifacts.sh"
  }
}
```

**Pre-commit Hook Integration:**

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Run cleanup before commit
npm run cleanup

# Continue with commit
exit 0
```

---

## Development Workflow Enhancements

### 1. Automated Code Formatting

**Pre-commit Hook for Formatting:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# 1. Validate syntax
npm run validate
if [ $? -ne 0 ]; then
    echo "❌ Syntax validation failed"
    exit 1
fi

# 2. Format changed files (if Prettier configured)
if command -v prettier &> /dev/null; then
    git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|json|md)$' | xargs prettier --write
    git add -u
fi

# 3. Run affected tests
npm test -- --onlyChanged --passWithNoTests

# 4. Cleanup artifacts
npm run cleanup

echo "✅ Pre-commit checks passed"
exit 0
```

### 2. Automated Test Selection

**Smart Test Runner:**

```bash
#!/bin/bash
# scripts/smart-test.sh

# Detect changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

# Determine which tests to run
if echo "$CHANGED_FILES" | grep -q "src/core/"; then
    echo "Core files changed, running core tests..."
    npm test -- __tests__/IbiraAPIFetcher.test.js __tests__/IbiraAPIFetchManager.test.js
elif echo "$CHANGED_FILES" | grep -q "src/utils/"; then
    echo "Utility files changed, running utility tests..."
    npm test -- __tests__/DefaultCache.test.js __tests__/DefaultEventNotifier.test.js
else
    echo "Running all tests..."
    npm test
fi
```

### 3. Development Environment Setup

**Automated Setup Script:**

```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "🚀 Setting up ibira.js development environment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Install pre-commit hooks
echo "🔧 Installing git hooks..."
mkdir -p .git/hooks
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# 3. Create necessary directories
echo "📁 Creating directories..."
mkdir -p .ai_workflow/backlog
mkdir -p coverage
mkdir -p logs

# 4. Initial validation
echo "✅ Validating setup..."
npm run validate

# 5. Run initial tests
echo "🧪 Running initial tests..."
npm test

# 6. Generate coverage report
echo "📊 Generating coverage report..."
npm run test:coverage

echo "✨ Development environment ready!"
echo ""
echo "Next steps:"
echo "  1. npm run test:watch  # Start watch mode"
echo "  2. Edit code and tests"
echo "  3. npm run cleanup     # Clean artifacts when needed"
```

---

## Quality Assurance Automation

### 1. Pre-Push Validation

**Complete Quality Check:**

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "Running pre-push quality checks..."

# 1. Validate syntax
echo "1/5 Validating syntax..."
npm run validate || exit 1

# 2. Run all tests
echo "2/5 Running tests..."
npm test || exit 1

# 3. Check coverage
echo "3/5 Checking coverage..."
npm run test:coverage || exit 1

# 4. Verify RT demonstration
echo "4/5 Verifying referential transparency..."
./test_pure_fetcher.js || exit 1

# 5. Cleanup
echo "5/5 Cleaning up artifacts..."
npm run cleanup

echo "✅ All quality checks passed"
exit 0
```

### 2. Automated Coverage Monitoring

**Coverage Threshold Script:**

```bash
#!/bin/bash
# scripts/check-coverage.sh

# Run tests with coverage
npm run test:coverage

# Parse coverage summary
COVERAGE=$(node -e "
const coverage = require('./coverage/coverage-summary.json');
const totals = coverage.total;
const failed = [];

if (totals.statements.pct < 75) failed.push('statements');
if (totals.branches.pct < 75) failed.push('branches');
if (totals.functions.pct < 75) failed.push('functions');
if (totals.lines.pct < 75) failed.push('lines');

if (failed.length > 0) {
  console.error('❌ Coverage below 75% for: ' + failed.join(', '));
  process.exit(1);
}

console.log('✅ Coverage thresholds met:');
console.log('  Statements: ' + totals.statements.pct + '%');
console.log('  Branches: ' + totals.branches.pct + '%');
console.log('  Functions: ' + totals.functions.pct + '%');
console.log('  Lines: ' + totals.lines.pct + '%');
")

exit $?
```

### 3. Automated Changelog Updates

**Changelog Generator:**

```bash
#!/bin/bash
# scripts/update-changelog.sh

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
COMMITS=$(git log ${LAST_TAG}..HEAD --oneline --no-merges)

# Generate changelog entry
echo "## [$VERSION] - $(date +%Y-%m-%d)" > /tmp/changelog-entry.md
echo "" >> /tmp/changelog-entry.md
echo "### Changes" >> /tmp/changelog-entry.md
echo "" >> /tmp/changelog-entry.md
echo "$COMMITS" | while read -r commit; do
    echo "- $commit" >> /tmp/changelog-entry.md
done

# Prepend to CHANGELOG.md
cat /tmp/changelog-entry.md CHANGELOG.md > /tmp/changelog-new.md
mv /tmp/changelog-new.md CHANGELOG.md

echo "✅ Changelog updated for version $VERSION"
```

---

## Documentation Workflow

### 1. Automated Documentation Checks

**Doc Validation Script:**

```bash
#!/bin/bash
# scripts/validate-docs.sh

echo "📖 Validating documentation..."

# Check for broken links
find docs -name "*.md" -exec grep -Hn "\]\(.*\.md\)" {} \; | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    link=$(echo "$line" | grep -oP '\]\(\K[^)]+' | grep "\.md")
    
    if [ ! -f "$link" ] && [ ! -f "docs/$link" ]; then
        echo "❌ Broken link in $file: $link"
        exit 1
    fi
done

echo "✅ Documentation validation passed"
```

### 2. Documentation Generation

**Auto-generate TOC:**

```bash
#!/bin/bash
# scripts/generate-toc.sh

# For each markdown file in docs
find docs -name "*.md" -type f | while read -r file; do
    echo "Generating TOC for $file..."
    
    # Extract headings and generate TOC
    grep -E '^#{1,3} ' "$file" | while read -r heading; do
        level=$(echo "$heading" | grep -oE '^#{1,3}' | wc -c)
        title=$(echo "$heading" | sed 's/^#* //')
        anchor=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
        
        indent=$(printf ' %.0s' $(seq 1 $((level * 2 - 2))))
        echo "${indent}- [$title](#$anchor)"
    done
done
```

---

## Future Enhancements

### 1. Automated Performance Monitoring

**Performance Test Script:**

```javascript
// scripts/perf-test.js
import { performance } from 'perf_hooks';
import { IbiraAPIFetcher } from './src/index.js';

async function measurePerformance() {
    const iterations = 1000;
    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    
    // Warm up
    const fetcher = IbiraAPIFetcher.withDefaultCache(url);
    await fetcher.fetchData();
    
    // Measure cache hits
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        await fetcher.fetchData();
    }
    const end = performance.now();
    
    const avgTime = (end - start) / iterations;
    console.log(`Average cache hit time: ${avgTime.toFixed(3)}ms`);
    
    // Set benchmark threshold
    if (avgTime > 1) {
        console.error('❌ Performance regression detected');
        process.exit(1);
    }
    
    console.log('✅ Performance within acceptable range');
}

measurePerformance();
```

### 2. Dependency Update Automation

**Update Check Script:**

```bash
#!/bin/bash
# scripts/check-updates.sh

echo "📦 Checking for dependency updates..."

# Check for outdated packages
npm outdated

# Security audit
npm audit

# Suggest updates
echo ""
echo "To update dependencies:"
echo "  npm update          # Update minor/patch"
echo "  npm audit fix       # Fix security issues"
echo "  npm outdated        # Check for major updates"
```

### 3. CI/CD Preparation Checklist

**Pre-CI Setup:**

```bash
#!/bin/bash
# scripts/prepare-ci.sh

echo "🔧 Preparing project for CI/CD..."

# 1. Verify all tests pass
npm run test:all || exit 1

# 2. Verify coverage meets thresholds
./scripts/check-coverage.sh || exit 1

# 3. Verify RT demonstration
./test_pure_fetcher.js || exit 1

# 4. Generate documentation
npm run generate-docs || true

# 5. Create CI configuration
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run test:all
    - run: npm run test:coverage
EOF

echo "✅ CI preparation complete"
echo "Next steps:"
echo "  1. Review .github/workflows/ci.yml"
echo "  2. Commit CI configuration"
echo "  3. Push to trigger first CI run"
```

---

## NPM Scripts Summary

Add these to `package.json`:

```json
{
  "scripts": {
    "cleanup": "bash scripts/cleanup-artifacts.sh",
    "cleanup:dry-run": "DRY_RUN=true bash scripts/cleanup-artifacts.sh",
    "cleanup:verbose": "VERBOSE=true bash scripts/cleanup-artifacts.sh",
    "dev-setup": "bash scripts/dev-setup.sh",
    "check-coverage": "bash scripts/check-coverage.sh",
    "validate-docs": "bash scripts/validate-docs.sh",
    "update-changelog": "bash scripts/update-changelog.sh",
    "check-updates": "bash scripts/check-updates.sh",
    "prepare-ci": "bash scripts/prepare-ci.sh",
    "perf-test": "node scripts/perf-test.js"
  }
}
```

---

## Implementation Checklist

- [ ] Create `scripts/` directory
- [ ] Add cleanup-artifacts.sh script
- [ ] Make all scripts executable
- [ ] Add NPM script definitions
- [ ] Install git hooks
- [ ] Test cleanup automation
- [ ] Verify pre-commit hooks work
- [ ] Document workflow in README
- [ ] Train team on new workflows
- [ ] Monitor and adjust as needed

---

## Monitoring & Maintenance

### Weekly Tasks
- Review cleanup logs
- Check artifact disk usage
- Verify hooks are functioning

### Monthly Tasks
- Review and adjust retention periods
- Update cleanup patterns
- Optimize script performance

### Quarterly Tasks
- Audit entire workflow
- Gather team feedback
- Implement improvements

---

## Related Documentation

- [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md) - Testing workflows
- [SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md) - All scripts reference
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

**Version:** 0.2.1-alpha  
**Last Updated:** December 31, 2025  
**Maintained By:** ibira.js Contributors
