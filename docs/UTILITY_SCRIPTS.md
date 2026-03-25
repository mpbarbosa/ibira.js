# Utility Scripts Documentation

This document provides comprehensive information about the utility scripts in ibira.js.

---

## Overview

ibira.js includes three utility scripts to assist with development, testing, and distribution:

1. **test-runner.js** - Test suite information display
2. **test_pure_fetcher.js** - Referential transparency demonstration
3. **cdn-delivery.sh** - CDN URL generation

All scripts are **executable** and can be run directly.

---

## 1. test-runner.js

### Purpose

Display available test commands, test structure, and coverage information for developers.

### Usage

```bash
# Method 1: Direct execution (requires execute permission)
./test-runner.js

# Method 2: Via Node.js
node test-runner.js
```

### What It Does

- Lists all available test commands
- Shows test file structure
- Displays test statistics (152 tests, 90%+ coverage)
- Provides coverage report location
- Shows quick start instructions

### Output Example

```text
🧪 ibira.js Test Suite
========================

Available test commands:
  npm test              - Run all tests
  npm run test:watch    - Run tests in watch mode
  npm run test:coverage - Run tests with coverage report
  ...

Test Statistics:
  Total Tests: 152 (151 passing, 1 skipped)
  Coverage: 90%+ across all metrics
  ...
```

### When to Use

- First-time setup to learn test commands
- Quick reference for test options
- Documentation for new contributors

### Note

**Informational only** - this script does not run tests, it only displays information. Use `npm test` to run actual tests.

---

## 2. test_pure_fetcher.js

### Purpose

Interactive demonstration of pure referential transparency principles in ibira.js, proving the 10/10 RT score.

### Usage

```bash
# Method 1: Direct execution (requires execute permission)
./test_pure_fetcher.js

# Method 2: Via Node.js
node test_pure_fetcher.js
```

### What It Does

Runs 6 comprehensive tests demonstrating:

1. **Pure Function Determinism** - Same inputs produce identical outputs
2. **Cache Hit Behavior** - Pure computation with cached data
3. **Cache Expiration** - Expired entry handling without side effects
4. **Error Handling** - Errors captured without throwing
5. **Cache Size Limits** - LRU eviction tracked in results
6. **Practical Wrapper** - Side-effect wrapper comparison

### Output Example

```text
╔════════════════════════════════════════════════════════╗
║  ibira.js - Pure Referential Transparency Test Suite  ║
║  Version: 0.4.12-alpha                                  ║
╚════════════════════════════════════════════════════════╝

🧪 Testing Pure Referential Transparency

📊 Test 1: Pure function determinism
✅ Same inputs produce identical results: true
✅ Original cache unchanged: true
✅ Result contains expected data: true
...

🎉 Pure Referential Transparency Tests Complete!

🌟 Benefits Achieved:
✅ 100% Deterministic - same inputs = same outputs
✅ Zero side effects - no external mutations
✅ Completely testable - mock all dependencies
...
```

### When to Use

- Learn about referential transparency concepts
- Demonstrate pure functional programming principles
- Verify RT properties during development
- Show potential contributors the architecture benefits
- Debugging pure vs side-effect behavior

### Benefits Demonstrated

- ✅ 100% Deterministic behavior
- ✅ Zero side effects in pure core
- ✅ Complete testability
- ✅ Time-travel debugging capabilities
- ✅ Concurrent safety
- ✅ Composable results

### Exit Codes

- `0` - All tests passed successfully
- `1` - Test suite failed (check error output)

---

## 3. cdn-delivery.sh

### Purpose

Generate CDN URLs for distributing ibira.js via jsDelivr CDN.

### Prerequisites

**Required:**

- Git installed and repository initialized
- Git repository has at least one commit
- Node.js and npm available (for package.json version)
- Script executed from repository root

**Check Prerequisites:**

```bash
# Check Git
git --version
# Output: git version 2.x.x

# Check Node.js
node --version
# Output: v18.x.x or higher

# Check npm
npm --version
# Output: 9.x.x or higher

# Verify repository
git status
# Should not say "not a git repository"
```

### Usage

```bash
# Method 1: Direct execution (requires execute permission)
./cdn-delivery.sh

# Method 2: Via Bash
bash cdn-delivery.sh
```

### What It Does

1. **Reads version** from `package.json`
2. **Generates CDN URLs** for:
   - Latest version (auto-updates)
   - Specific version (pinned)
   - Minified files
   - Individual modules
3. **Displays URLs** in formatted output
4. **Creates `cdn-urls.txt`** file with all URLs

### Output

**Terminal Output:**

```text
🌐 ibira.js CDN Delivery URLs
==============================

📦 Package Version: 0.4.12-alpha

Latest Version (Auto-updating):
  Main: https://cdn.jsdelivr.net/gh/mpbarbosa/ibira.js/src/index.js
  IbiraAPIFetcher: https://cdn.jsdelivr.net/gh/mpbarbosa/ibira.js/src/core/IbiraAPIFetcher.js
  ...

Specific Version (Production):
  Main: https://cdn.jsdelivr.net/gh/mpbarbosa/ibira.js@0.4.12-alpha/src/index.js
  ...

✅ URLs saved to: cdn-urls.txt
```

**File Output (`cdn-urls.txt`):**

```text
ibira.js CDN Delivery URLs
Version: 0.4.12-alpha
Generated: 2025-12-31

=== Latest Version (Auto-updating) ===
...

=== Specific Version (0.4.12-alpha) ===
...
```

### When to Use

- Before publishing a new release
- Updating documentation with CDN links
- Providing installation options to users
- Testing CDN delivery
- Generating URLs for external integrations

### Command-Line Arguments

**None** - This script does not accept command-line arguments. Configuration is automatic based on:

- Repository location (detected via `git`)
- Package version (from `package.json`)
- File structure (from `src/` directory)

### Error Handling

#### Error: Git not found

```bash
./cdn-delivery.sh: line X: git: command not found
```

**Solution:**

```bash
# Ubuntu/Debian
sudo apt-get install git

# macOS
brew install git

# Verify
git --version
```

#### Error: Not a git repository

```bash
fatal: not a git repository (or any parent up to mount point)
```

**Solution:**

```bash
# Initialize git repository
git init

# Add files
git add .

# Make first commit
git commit -m "Initial commit"
```

#### Error: Package.json not found

```bash
cat: package.json: No such file or directory
```

**Solution:**

```bash
# Ensure you're in repository root
cd /path/to/ibira.js

# Verify package.json exists
ls -la package.json

# Run script from correct location
./cdn-delivery.sh
```

#### Error: Permission denied

```bash
bash: ./cdn-delivery.sh: Permission denied
```

**Solution:**

```bash
# Make script executable
chmod +x cdn-delivery.sh

# Verify permissions
ls -la cdn-delivery.sh
# Should show: -rwxrwxr-x

# Run again
./cdn-delivery.sh
```

### Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Git command fails | Git not installed | Install git: `sudo apt-get install git` |
| Version not found | Wrong directory | Run from repository root |
| Permission denied | Not executable | `chmod +x cdn-delivery.sh` |
| URLs incorrect | Old commits | Push latest commits to GitHub |
| File not created | Write permissions | Check directory write permissions |

### Advanced Usage

#### Customize Output Location

```bash
# Redirect output to custom file
./cdn-delivery.sh > my-custom-urls.txt
```

#### Extract Specific URLs

```bash
# Get only minified URLs
./cdn-delivery.sh | grep "min.js"

# Get only specific version URLs
./cdn-delivery.sh | grep "@0.4.12-alpha"
```

#### Automate in CI/CD

```yaml
# GitHub Actions example
- name: Generate CDN URLs
  run: |
    ./cdn-delivery.sh
    cat cdn-urls.txt >> $GITHUB_STEP_SUMMARY
```

---

## Permissions Summary

All scripts should be executable:

```bash
# Check current permissions
ls -la test-runner.js test_pure_fetcher.js cdn-delivery.sh

# Expected output (executable):
-rwxrwxr-x ... test-runner.js
-rwxrwxr-x ... test_pure_fetcher.js
-rwxrwxr-x ... cdn-delivery.sh

# If not executable, fix permissions
chmod +x test-runner.js test_pure_fetcher.js cdn-delivery.sh
```

---

## Quick Reference Table

| Script | Purpose | Input | Output | Executable |
|--------|---------|-------|--------|------------|
| `test-runner.js` | Show test info | None | Terminal display | ✅ Yes |
| `test_pure_fetcher.js` | RT demonstration | None | Test results + exit code | ✅ Yes |
| `cdn-delivery.sh` | Generate CDN URLs | None | URLs + cdn-urls.txt | ✅ Yes |

---

## Integration with Documentation

These scripts are referenced in:

- **README.md** - Quick start and utilities section
- **docs/QUICK_REFERENCE.md** - NPM scripts reference
- **docs/INDEX.md** - Developer tools section
- **docs/TROUBLESHOOTING.md** - Test execution guidance

---

## Contributing

When modifying these scripts:

1. **Maintain backward compatibility** - don't break existing usage
2. **Update documentation** - keep this file in sync
3. **Test thoroughly** - verify on clean install
4. **Follow conventions** - match existing style and output format
5. **Document changes** - update CHANGELOG.md

---

## Support

For issues with these scripts:

1. Check this documentation
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Check [FAQ.md](./FAQ.md)
4. Open an issue on [GitHub](https://github.com/mpbarbosa/ibira.js/issues)

---

**Version:** 0.4.12-alpha
**Last Updated:** December 31, 2025
**Maintained By:** ibira.js Contributors
