# Scripts Reference Guide

**Version:** 0.2.1-alpha  
**Last Updated:** December 31, 2025  
**Purpose:** Centralized reference for all scripts in the ibira.js project

---

## Overview

This document provides a centralized reference for all scripts in the ibira.js repository, including NPM scripts, utility scripts, and shell scripts.

## Table of Contents

1. [NPM Scripts](#npm-scripts)
2. [Utility Scripts](#utility-scripts)
3. [Shell Scripts](#shell-scripts)
4. [Script Workflows](#script-workflows)
5. [Troubleshooting](#troubleshooting)
6. [CI/CD Integration](#cicd-integration)

---

## NPM Scripts

All NPM scripts are defined in `package.json` and can be run with `npm run <script-name>`.

### Testing Scripts

#### `npm test`
**Command:** `jest`  
**Purpose:** Run all tests once  
**Output:** Test results with pass/fail summary  
**Exit Code:** 0 (success), 1 (failure)

```bash
npm test

# Output:
# PASS  __tests__/IbiraAPIFetcher.test.js
# PASS  __tests__/DefaultCache.test.js
# Tests: 151 passed, 1 skipped, 152 total
```

**When to Use:**
- Pre-commit validation
- Manual test execution
- CI/CD pipelines
- After code changes

**Related Documentation:** [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md#npm-test)

---

#### `npm run test:watch`
**Command:** `jest --watch`  
**Purpose:** Run tests in watch mode with file monitoring  
**Output:** Interactive test runner  
**Exit Code:** Manual exit only (Ctrl+C)

```bash
npm run test:watch

# Interactive commands:
# › Press f to run only failed tests.
# › Press o to only run tests related to changed files.
# › Press p to filter by a filename regex pattern.
# › Press t to filter by a test name regex pattern.
# › Press q to quit watch mode.
```

**When to Use:**
- Active development
- TDD workflow
- Continuous feedback during coding
- Debugging tests

**Best Practices:**
- Keep running in separate terminal
- Use `o` to run only affected tests
- Use `f` to focus on failures

**Related Documentation:** [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md#npm-run-testwatch)

---

#### `npm run test:coverage`
**Command:** `jest --coverage`  
**Purpose:** Run tests and generate coverage report  
**Output:** Coverage percentages + HTML report  
**Exit Code:** 0 (success), 1 (failure or coverage below threshold)

```bash
npm run test:coverage

# Output:
# ----------------------|---------|----------|---------|---------|
# File                  | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------|---------|----------|---------|---------|
# All files             |   90.45 |    82.14 |    75.7 |   91.72 |
```

**Generates:**
- `coverage/lcov-report/index.html` - Visual coverage report
- `coverage/coverage-summary.json` - JSON summary
- `coverage/lcov.info` - LCOV format for CI tools

**When to Use:**
- Before committing changes
- Code review preparation
- Quality assurance checks
- Identifying untested code

**Thresholds:**
- Statements: 75% minimum
- Branches: 75% minimum
- Functions: 75% minimum
- Lines: 75% minimum

**Related Documentation:** [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md#npm-run-testcoverage)

---

#### `npm run test:verbose`
**Command:** `jest --verbose`  
**Purpose:** Run tests with detailed output  
**Output:** Individual test names and execution times  
**Exit Code:** 0 (success), 1 (failure)

```bash
npm run test:verbose

# Output:
# PASS  __tests__/IbiraAPIFetcher.test.js
#   IbiraAPIFetcher - Construction
#     ✓ should create instance with URL (5ms)
#     ✓ should create instance with options (3ms)
```

**When to Use:**
- Debugging test failures
- Understanding test execution flow
- Identifying slow tests
- Detailed test output needed

**Related Documentation:** [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md#npm-run-testverbose)

---

#### `npm run validate`
**Command:** `node -c src/index.js`  
**Purpose:** Validate JavaScript syntax without running tests  
**Output:** Silent on success, error on syntax issues  
**Exit Code:** 0 (valid syntax), 1 (syntax error)

```bash
npm run validate

# Success: (no output)

# Error:
# SyntaxError: Unexpected token
```

**When to Use:**
- Quick syntax check (< 1 second)
- Pre-test validation
- Editor/IDE integration
- CI/CD fast fail

**Advantages:**
- Very fast (< 1 second)
- No dependencies needed
- Catches syntax errors early
- Good for pre-commit hooks

**Related Documentation:** [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md#npm-run-validate)

---

#### `npm run test:all`
**Command:** `npm run validate && npm test`  
**Purpose:** Validate syntax then run all tests  
**Output:** Combined validation and test output  
**Exit Code:** 0 (all pass), 1 (any failure)

```bash
npm run test:all

# Runs:
# 1. npm run validate  (syntax check)
# 2. npm test          (all tests)
```

**When to Use:**
- Pre-commit workflow
- CI/CD pipelines
- Comprehensive validation
- Single command quality check

**Workflow:**
```bash
# Only commits if everything passes
npm run test:all && git commit -m "feat: new feature"
```

**Related Documentation:** [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md#npm-run-testall)

---

## Utility Scripts

Scripts located in the repository root for development and testing assistance.

### test-runner.js

**Type:** Node.js utility script  
**Purpose:** Display test commands and test suite information  
**Executable:** Yes (`#!/usr/bin/env node`)  
**Permissions:** `-rwxrwxr-x` (775)

**Usage:**
```bash
# Method 1: Direct execution
./test-runner.js

# Method 2: Via Node.js
node test-runner.js
```

**Output:**
- Available test commands
- Test file structure
- Test statistics (152 tests, 90%+ coverage)
- Coverage report location
- Quick start guide

**Note:** Informational only - does not run tests

**When to Use:**
- First-time project setup
- Quick command reference
- Onboarding new contributors
- Documentation lookup

**Related Files:**
- Source: `test-runner.js`
- Documentation: [UTILITY_SCRIPTS.md](./UTILITY_SCRIPTS.md#1-test-runnerjs)

---

### test_pure_fetcher.js

**Type:** Node.js demonstration script  
**Purpose:** Interactive demonstration of referential transparency  
**Executable:** Yes (`#!/usr/bin/env node`)  
**Permissions:** `-rwxrwxr-x` (775)

**Usage:**
```bash
# Method 1: Direct execution
./test_pure_fetcher.js

# Method 2: Via Node.js
node test_pure_fetcher.js
```

**Tests Performed:**
1. Pure function determinism (same inputs = same outputs)
2. Cache hit behavior (pure computation)
3. Cache expiration handling
4. Error handling without side effects
5. Cache size limits and LRU eviction
6. Practical wrapper comparison

**Exit Codes:**
- `0` - All tests passed
- `1` - Test failure

**When to Use:**
- Verify referential transparency
- Demonstrate pure functional programming
- Before major releases
- After refactoring core functionality
- Debugging pure vs side-effect behavior

**Related Files:**
- Source: `test_pure_fetcher.js`
- Documentation: [UTILITY_SCRIPTS.md](./UTILITY_SCRIPTS.md#2-test_pure_fetcherjs)

---

## Shell Scripts

Bash scripts for automation and tooling.

### cdn-delivery.sh

**Type:** Bash shell script  
**Purpose:** Generate CDN URLs for jsDelivr distribution  
**Executable:** Yes (`#!/bin/bash`)  
**Permissions:** `-rwxrwxr-x` (775)

**Prerequisites:**
- Git installed and repository initialized
- Node.js and npm available
- Run from repository root
- At least one git commit exists

**Usage:**
```bash
# Method 1: Direct execution
./cdn-delivery.sh

# Method 2: Via Bash
bash cdn-delivery.sh
```

**Output:**
- CDN URLs displayed in terminal
- `cdn-urls.txt` file created with all URLs
- Latest version, specific version, and minified URLs

**Generated URLs:**
- Latest version (auto-updating)
- Specific version (pinned to release)
- Individual module URLs
- Minified versions

**When to Use:**
- Before publishing new release
- Updating documentation with CDN links
- Providing installation options
- Testing CDN delivery

**Troubleshooting:**
- Git not found: `sudo apt-get install git`
- Permission denied: `chmod +x cdn-delivery.sh`
- Version mismatch: Commit and push latest changes

**Related Files:**
- Source: `cdn-delivery.sh`
- Output: `cdn-urls.txt`
- Documentation: [UTILITY_SCRIPTS.md](./UTILITY_SCRIPTS.md#3-cdn-deliverysh)

---

## Script Workflows

Common workflows combining multiple scripts.

### Development Workflow

```bash
# 1. Start development
git checkout -b feature/new-feature
npm run test:watch          # Keep running in terminal

# 2. Write code with TDD
# - Edit test file
# - Watch mode shows failure (RED)
# - Edit source file
# - Watch mode shows success (GREEN)
# - Refactor code
# - Watch mode confirms tests pass

# 3. Before commit
npm run test:all            # Validate + test
npm run test:coverage       # Check coverage

# 4. Commit changes
git add .
git commit -m "feat: new feature"
git push origin feature/new-feature
```

### Pre-Commit Workflow

```bash
# Quick validation
npm run validate            # < 1 second

# Full validation
npm run test:all            # Syntax + tests

# With coverage
npm run test:all && npm run test:coverage

# Automated (one command)
npm run test:all && git commit -m "message"
```

### Release Workflow

```bash
# 1. Update version
npm version patch           # or minor, major

# 2. Run full test suite
npm run test:coverage

# 3. Verify RT demonstration
./test_pure_fetcher.js

# 4. Generate CDN URLs
./cdn-delivery.sh

# 5. Update documentation
# Edit CHANGELOG.md, README.md

# 6. Commit and tag
git add .
git commit -m "chore: release v0.2.2-alpha"
git tag v0.2.2-alpha

# 7. Push with tags
git push && git push --tags
```

### Debugging Workflow

```bash
# 1. Run verbose tests
npm run test:verbose

# 2. Run specific test file
npm test -- IbiraAPIFetcher.test.js

# 3. Run specific test pattern
npm test -- --testNamePattern="should cache"

# 4. Check coverage for specific file
npm run test:coverage
open coverage/lcov-report/IbiraAPIFetcher.js.html
```

---

## Troubleshooting

### Script Execution Issues

#### Script Not Found
```bash
# Error: ./script.js: No such file or directory

# Solution: Verify file exists
ls -la script.js

# Ensure you're in repository root
cd /path/to/ibira.js
```

#### Permission Denied
```bash
# Error: bash: ./script.js: Permission denied

# Solution: Make executable
chmod +x script.js

# Verify permissions
ls -la script.js
# Should show: -rwxrwxr-x
```

#### NPM Script Not Found
```bash
# Error: npm ERR! missing script: test:xyz

# Solution: Check available scripts
npm run

# Verify script exists in package.json
cat package.json | grep "\"scripts\""
```

### Test Execution Issues

#### Tests Failing After Clean Install
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

#### Watch Mode Not Working
```bash
# Restart watch mode
# Press 'q' to quit, then:
npm run test:watch

# Check file system watchers (Linux)
cat /proc/sys/fs/inotify/max_user_watches
```

#### Coverage Below Threshold
```bash
# Identify uncovered code
npm run test:coverage
open coverage/lcov-report/index.html

# Focus on red/yellow areas
# Add tests for uncovered lines
```

### Shell Script Issues

#### Shebang Not Working
```bash
# Error: ./script.sh: bad interpreter

# Solution: Verify shebang
head -1 script.sh
# Should be: #!/bin/bash or #!/usr/bin/env node

# Check line endings (Windows vs Unix)
dos2unix script.sh  # If available
```

---

## CI/CD Integration

### Future CI/CD Considerations (Post-Alpha)

When the project moves beyond alpha stage, consider implementing:

#### GitHub Actions

**Suggested Workflow:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: npm run validate
    - run: npm test
    - run: npm run test:coverage
```

#### GitLab CI

**Suggested Pipeline:**
```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test

validate:
  stage: validate
  script:
    - npm ci
    - npm run validate

test:
  stage: test
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
```

#### Script Integration Points

1. **Validation Stage**
   - `npm run validate` - Fast syntax check
   - Exit on syntax errors before running tests

2. **Test Stage**
   - `npm test` - Run all tests
   - `npm run test:coverage` - Generate coverage reports
   - Upload coverage to Codecov/Coveralls

3. **Utility Scripts**
   - `./test_pure_fetcher.js` - Verify RT in separate job
   - `./cdn-delivery.sh` - Generate URLs on release

4. **Quality Gates**
   - Enforce coverage thresholds (75% minimum)
   - Block PRs with failing tests
   - Require passing RT demonstration

**Benefits:**
- ✅ Automated testing on every commit
- ✅ Multi-version Node.js testing
- ✅ Coverage tracking over time
- ✅ Quality gates enforcement
- ✅ Consistent validation across contributors

**Recommended Tools:**
- **Codecov** - Coverage tracking and visualization
- **SonarQube** - Code quality analysis
- **Dependabot** - Dependency updates
- **Prettier/ESLint** - Code formatting and linting

---

## Quick Reference Table

### All Scripts Summary

| Script | Type | Purpose | Executable | When to Use |
|--------|------|---------|------------|-------------|
| `npm test` | NPM | Run all tests | N/A | Pre-commit, CI/CD |
| `npm run test:watch` | NPM | Watch mode | N/A | Development |
| `npm run test:coverage` | NPM | Coverage report | N/A | Code review |
| `npm run test:verbose` | NPM | Detailed output | N/A | Debugging |
| `npm run validate` | NPM | Syntax check | N/A | Quick validation |
| `npm run test:all` | NPM | Validate + test | N/A | Pre-commit |
| `./test-runner.js` | Utility | Show test info | ✅ Yes | Information |
| `./test_pure_fetcher.js` | Utility | RT demo | ✅ Yes | Verification |
| `./cdn-delivery.sh` | Shell | CDN URLs | ✅ Yes | Release prep |

### Exit Codes

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | Continue workflow |
| 1 | Failure | Fix errors before proceeding |

### File Locations

| File | Location | Purpose |
|------|----------|---------|
| NPM scripts | `package.json` | Script definitions |
| Test files | `__tests__/` | Test suites |
| Coverage | `coverage/` | Coverage reports |
| Utility scripts | Repository root | Helper scripts |
| CDN URLs | `cdn-urls.txt` | Generated CDN URLs |

---

## Related Documentation

- [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md) - Complete testing workflows
- [UTILITY_SCRIPTS.md](./UTILITY_SCRIPTS.md) - Detailed utility script docs
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick lookup guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ.md](./FAQ.md) - Frequently asked questions

---

## Maintenance

This document should be updated when:
- New scripts are added
- Script behavior changes
- New workflows are established
- CI/CD integration is implemented
- Tools or dependencies change

**Maintainers:** Review this document quarterly or after major changes.

---

**Version:** 0.2.1-alpha  
**Last Updated:** December 31, 2025  
**Maintained By:** ibira.js Contributors
