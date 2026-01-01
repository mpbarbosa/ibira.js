# Testing Workflow Guide

**Version:** 0.2.1-alpha  
**Last Updated:** December 31, 2025

---

## Overview

This guide covers the complete testing workflow for ibira.js, including automated and manual testing strategies, CI/CD integration, and best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Automated Testing](#automated-testing)
3. [Manual Testing](#manual-testing)
4. [Test Workflow Patterns](#test-workflow-patterns)
5. [CI/CD Integration](#cicd-integration)
6. [Coverage Requirements](#coverage-requirements)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/mpbarbosa/ibira.js.git
cd ibira.js

# 2. Install dependencies
npm install

# 3. Verify installation
npm run validate

# 4. Run tests
npm test

# 5. Check coverage
npm run test:coverage
```

### Daily Development Workflow

```bash
# Start watch mode while coding
npm run test:watch

# Make changes to code...

# Watch mode automatically re-runs tests
# Fix any failing tests before committing
```

---

## Automated Testing

### Test Suite Overview

| Test File | Tests | Coverage | Purpose |
|-----------|-------|----------|---------|
| `IbiraAPIFetcher.test.js` | 60+ | Core functionality | Main fetcher class tests |
| `IbiraAPIFetchManager.test.js` | 40+ | Manager coordination | Multi-endpoint management |
| `DefaultCache.test.js` | 30+ | Cache implementation | LRU cache with expiration |
| `DefaultEventNotifier.test.js` | 35+ | Event system | Observer pattern tests |
| `index.test.js` | ~5 | Export validation | API surface tests |

**Total:** 152 tests (151 passing, 1 skipped)

### NPM Test Commands

#### `npm test` - Standard Test Execution
**Purpose:** Run all tests once  
**Use Case:** Pre-commit checks, manual verification  
**Output:** Pass/fail summary with any failures

```bash
npm test

# Output:
# PASS  __tests__/IbiraAPIFetcher.test.js
# PASS  __tests__/DefaultCache.test.js
# ...
# Tests: 151 passed, 1 skipped, 152 total
# Time: 2.5s
```

#### `npm run test:watch` - Watch Mode
**Purpose:** Automatically re-run tests on file changes  
**Use Case:** Active development, TDD workflow  
**Features:**
- Watches for file changes
- Only re-runs affected tests
- Interactive mode with filtering options

```bash
npm run test:watch

# Output:
# Watch Usage
#  › Press f to run only failed tests.
#  › Press o to only run tests related to changed files.
#  › Press p to filter by a filename regex pattern.
#  › Press t to filter by a test name regex pattern.
#  › Press q to quit watch mode.
```

**Watch Mode Workflow:**
```bash
# 1. Start watch mode
npm run test:watch

# 2. Edit a file (e.g., src/core/IbiraAPIFetcher.js)
# 3. Watch mode detects change and re-runs related tests
# 4. See results immediately
# 5. Fix any failures
# 6. Tests re-run automatically
# 7. Continue development
```

#### `npm run test:coverage` - Coverage Report
**Purpose:** Generate detailed coverage report  
**Use Case:** Pre-commit, code review, quality checks  
**Output:** Coverage percentages + HTML report

```bash
npm run test:coverage

# Output:
# ----------------------|---------|----------|---------|---------|
# File                  | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------|---------|----------|---------|---------|
# All files             |   90.45 |    82.14 |    75.7 |   91.72 |
#  IbiraAPIFetcher.js   |   95.23 |    87.50 |   88.88 |   96.15 |
#  DefaultCache.js      |   100.0 |    91.66 |   100.0 |   100.0 |
# ...
```

**Coverage Files Generated:**
```
coverage/
├── lcov-report/
│   └── index.html          # Open in browser for visual report
├── coverage-summary.json    # Machine-readable summary
└── lcov.info               # LCOV format for CI tools
```

**View Coverage Report:**
```bash
# After running test:coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

#### `npm run test:verbose` - Detailed Output
**Purpose:** Show detailed test execution information  
**Use Case:** Debugging test failures, understanding test flow  
**Output:** Individual test names and execution times

```bash
npm run test:verbose

# Output:
# PASS  __tests__/IbiraAPIFetcher.test.js
#   IbiraAPIFetcher - Construction
#     ✓ should create instance with URL (5ms)
#     ✓ should create instance with options (3ms)
#   IbiraAPIFetcher - fetchData()
#     ✓ should fetch data successfully (15ms)
#     ✓ should cache response data (8ms)
# ...
```

#### `npm run validate` - Syntax Validation
**Purpose:** Check JavaScript syntax without running tests  
**Use Case:** Quick syntax check, pre-commit validation  
**Speed:** Fast (< 1 second)

```bash
npm run validate

# Success output: (no output = success)
# 
# Error output:
# SyntaxError: Unexpected token
```

#### `npm run test:all` - Complete Validation
**Purpose:** Validate syntax + run all tests  
**Use Case:** Pre-commit workflow, CI/CD pipeline  
**Combines:** `validate` + `test`

```bash
npm run test:all

# Runs:
# 1. npm run validate  # Syntax check
# 2. npm test          # All tests
```

---

## Manual Testing

### Manual Test Scripts

#### 1. test-runner.js - Test Information Display
**Purpose:** Display test commands and structure  
**Type:** Informational (doesn't run tests)

```bash
# Display test information
./test-runner.js

# Shows:
# - Available test commands
# - Test file structure
# - Coverage information
# - Quick start guide
```

#### 2. test_pure_fetcher.js - RT Demonstration
**Purpose:** Manual verification of referential transparency  
**Type:** Interactive demonstration with live results

```bash
# Run RT demonstration
./test_pure_fetcher.js

# Tests:
# ✅ Pure function determinism
# ✅ Cache hit behavior
# ✅ Cache expiration
# ✅ Error handling
# ✅ Cache size limits
# ✅ Practical wrapper comparison
```

**When to Run:**
- Before major releases
- After refactoring pure functional core
- When demonstrating RT properties
- Debugging pure vs side-effect behavior

#### 3. Manual API Testing
**Purpose:** Test real API endpoints

```bash
# Create test file: test-manual-api.js
cat > test-manual-api.js << 'EOF'
import { IbiraAPIFetcher } from './src/index.js';

async function testRealAPI() {
  console.log('Testing real API...');
  
  const fetcher = IbiraAPIFetcher.withDefaultCache(
    'https://jsonplaceholder.typicode.com/posts/1'
  );
  
  try {
    const data = await fetcher.fetchData();
    console.log('✅ Success:', data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealAPI();
EOF

# Run manual test
node test-manual-api.js
```

---

## Test Workflow Patterns

### Pattern 1: Test-Driven Development (TDD)

**Workflow:**
```bash
# 1. Start watch mode
npm run test:watch

# 2. Write failing test first
# Edit: __tests__/NewFeature.test.js
test('should do something new', () => {
  expect(newFeature()).toBe('expected');
});

# 3. Watch mode shows failure (RED)
# ❌ Test fails: newFeature is not defined

# 4. Implement minimum code to pass
# Edit: src/core/NewFeature.js
export function newFeature() {
  return 'expected';
}

# 5. Watch mode shows success (GREEN)
# ✅ Test passes

# 6. Refactor code for quality
# Edit: src/core/NewFeature.js
# (improve implementation)

# 7. Watch mode confirms tests still pass
# ✅ All tests pass

# 8. Commit
git add .
git commit -m "feat: add new feature"
```

### Pattern 2: Pre-Commit Checklist

**Manual Workflow:**
```bash
# 1. Validate syntax
npm run validate
# ✅ No syntax errors

# 2. Run all tests
npm test
# ✅ 151 passed, 1 skipped

# 3. Check coverage
npm run test:coverage
# ✅ 90%+ coverage maintained

# 4. Review changes
git diff

# 5. Stage changes
git add .

# 6. Commit
git commit -m "type: description"

# 7. Push
git push
```

**Automated Workflow (using test:all):**
```bash
# Single command validation
npm run test:all && git commit -m "type: description"

# Only commits if tests pass
```

### Pattern 3: Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-caching

# 2. Start watch mode
npm run test:watch

# 3. Develop feature with tests
# - Write test
# - Implement code
# - Refactor
# - Repeat

# 4. Before pushing, validate everything
npm run test:all
npm run test:coverage

# 5. Verify coverage thresholds met
# Check: coverage/lcov-report/index.html

# 6. Push branch
git push origin feature/new-caching

# 7. Create pull request
# CI will run tests automatically
```

### Pattern 4: Bug Fix Workflow

```bash
# 1. Create failing test that reproduces bug
# Edit: __tests__/IbiraAPIFetcher.test.js
test('should handle edge case XYZ', () => {
  // Test that currently fails
  expect(buggyBehavior()).toBe('correct');
});

# 2. Verify test fails
npm test
# ❌ Test fails (confirms bug exists)

# 3. Fix bug
# Edit: src/core/IbiraAPIFetcher.js

# 4. Verify test passes
npm test
# ✅ Test passes (bug fixed)

# 5. Run full suite
npm run test:coverage
# ✅ All tests pass, coverage maintained

# 6. Commit with test
git commit -m "fix: handle edge case XYZ"
```

### Pattern 5: Code Review Preparation

**Pre-Review Checklist:**
```bash
# 1. Full test suite
npm run test:all
# ✅ Pass

# 2. Coverage report
npm run test:coverage
# ✅ 90%+ coverage

# 3. Manual RT verification (if core changes)
./test_pure_fetcher.js
# ✅ All RT tests pass

# 4. Syntax validation
npm run validate
# ✅ No errors

# 5. Generate coverage report for review
open coverage/lcov-report/index.html

# 6. Create detailed PR description with:
# - What changed
# - Test coverage stats
# - Manual testing performed
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Validate syntax
      run: npm run validate
    
    - name: Run tests
      run: npm test
    
    - name: Generate coverage
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: true
    
    - name: Coverage threshold check
      run: |
        node -e "
        const coverage = require('./coverage/coverage-summary.json');
        const totals = coverage.total;
        const failed = [];
        if (totals.statements.pct < 75) failed.push('statements');
        if (totals.branches.pct < 75) failed.push('branches');
        if (totals.functions.pct < 75) failed.push('functions');
        if (totals.lines.pct < 75) failed.push('lines');
        if (failed.length > 0) {
          console.error('Coverage below 75% for: ' + failed.join(', '));
          process.exit(1);
        }
        console.log('✅ Coverage thresholds met');
        "
```

### GitLab CI Example

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - coverage

validate:
  stage: validate
  script:
    - npm ci
    - npm run validate

test:
  stage: test
  script:
    - npm ci
    - npm test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

coverage:
  stage: coverage
  script:
    - npm ci
    - npm run test:coverage
  artifacts:
    paths:
      - coverage/
    expire_in: 30 days
```

### Pre-Commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running pre-commit tests..."

# Validate syntax
npm run validate
if [ $? -ne 0 ]; then
  echo "❌ Syntax validation failed"
  exit 1
fi

# Run tests
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "✅ All checks passed"
exit 0
```

**Install pre-commit hook:**
```bash
# Make executable
chmod +x .git/hooks/pre-commit

# Or use husky
npm install husky --save-dev
npx husky install
npx husky add .git/hooks/pre-commit "npm run test:all"
```

---

## Coverage Requirements

### Current Coverage Thresholds

Configured in `package.json`:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 75,
        "functions": 75,
        "lines": 75,
        "statements": 75
      }
    }
  }
}
```

### Current Coverage Status

| Metric | Threshold | Current | Status |
|--------|-----------|---------|--------|
| Statements | 75% | 90.45% | ✅ Pass |
| Branches | 75% | 82.14% | ✅ Pass |
| Functions | 75% | 75.7% | ✅ Pass |
| Lines | 75% | 91.72% | ✅ Pass |

### Maintaining Coverage

**When adding new code:**

1. **Write tests first** (TDD approach)
2. **Check coverage impact:**
   ```bash
   npm run test:coverage
   ```
3. **Review uncovered lines:**
   - Open `coverage/lcov-report/index.html`
   - Click on file name
   - Red lines = not covered
   - Yellow lines = partially covered
   - Green lines = fully covered

4. **Add tests for uncovered code**
5. **Verify coverage improves:**
   ```bash
   npm run test:coverage
   ```

**Coverage Reports Location:**
```
coverage/
├── lcov-report/
│   ├── index.html           # Main coverage report
│   ├── IbiraAPIFetcher.js.html  # Per-file detail
│   └── ...
├── coverage-summary.json    # JSON summary
└── lcov.info               # LCOV format
```

---

## Troubleshooting

### Tests Failing Locally

**Issue:** Tests pass in CI but fail locally

**Solutions:**
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Clear Jest cache
npm test -- --clearCache

# 3. Run with verbose output
npm run test:verbose
```

### Watch Mode Not Detecting Changes

**Issue:** Files change but tests don't re-run

**Solutions:**
```bash
# 1. Restart watch mode
# Press 'q' to quit, then restart
npm run test:watch

# 2. Run all tests manually
# Press 'a' in watch mode

# 3. Check file system watchers (Linux)
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase:
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Coverage Threshold Failures

**Issue:** Coverage below 75% threshold

**Solutions:**
```bash
# 1. Identify uncovered code
npm run test:coverage
open coverage/lcov-report/index.html

# 2. Add tests for uncovered lines
# Focus on red/yellow areas in HTML report

# 3. Verify improvement
npm run test:coverage
```

### Specific Test Failures

**Debug single test:**
```bash
# Run specific test file
npm test -- IbiraAPIFetcher.test.js

# Run specific test by name
npm test -- --testNamePattern="should fetch data"

# Run in verbose mode
npm run test:verbose -- IbiraAPIFetcher.test.js
```

### Performance Issues

**Issue:** Tests running slowly

**Solutions:**
```bash
# 1. Run tests in parallel (default)
npm test

# 2. Run specific test file only
npm test -- __tests__/FastTests.test.js

# 3. Use watch mode to run only affected tests
npm run test:watch
# Press 'o' for changed files only
```

---

## Best Practices

### 1. Always Write Tests First (TDD)
```bash
# Good workflow
npm run test:watch  # Start watch mode
# Write test → Implement → Refactor → Repeat
```

### 2. Use Meaningful Test Names
```javascript
// ✅ Good
test('should cache response after successful fetch', () => {});

// ❌ Bad
test('test 1', () => {});
```

### 3. Maintain High Coverage
```bash
# Check coverage before every commit
npm run test:coverage

# Aim for > 90% across all metrics
```

### 4. Run Full Suite Before Pushing
```bash
# Pre-push validation
npm run test:all
```

### 5. Use Watch Mode During Development
```bash
# Start watch mode and keep it running
npm run test:watch
```

### 6. Document Complex Tests
```javascript
// ✅ Good - explains why
test('should retry on 503 status (temporary server error)', async () => {
  // 503 indicates temporary failure, should retry
  mockFetch.mockRejectedValueOnce(new Error('HTTP error! status: 503'));
  mockFetch.mockResolvedValueOnce({ data: 'success' });
  
  const result = await fetcher.fetchData();
  expect(result).toEqual({ data: 'success' });
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
```

---

## Quick Reference

### Automated Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run test:verbose     # Detailed output
npm run validate         # Syntax only
npm run test:all         # Validate + test
```

### Manual Tests
```bash
./test-runner.js         # Show test info
./test_pure_fetcher.js   # RT demonstration
```

### Coverage
```bash
npm run test:coverage                        # Generate report
open coverage/lcov-report/index.html         # View HTML report
```

### Workflow
```bash
# TDD: npm run test:watch → write test → implement → refactor
# Pre-commit: npm run test:all
# Pre-review: npm run test:coverage
```

---

## Related Documentation

- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - NPM scripts table
- [UTILITY_SCRIPTS.md](./UTILITY_SCRIPTS.md) - Test utility scripts
- [TDD_GUIDE.md](../.github/TDD_GUIDE.md) - Test-driven development
- [UNIT_TEST_GUIDE.md](../.github/UNIT_TEST_GUIDE.md) - Unit testing practices
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

**Version:** 0.2.1-alpha  
**Maintained By:** ibira.js Contributors  
**Last Updated:** December 31, 2025
