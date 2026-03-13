# ibira.js

> Zero-dependency JavaScript/TypeScript library for API data fetching with LRU caching and observer pattern

[![npm version](https://badge.fury.io/js/ibira.js.svg)](https://www.npmjs.com/package/ibira.js)
[![Node.js >=18](https://img.shields.io/node/v/ibira.js.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Version:** 0.3.5-alpha
**Status:** 🚧 Beta Preparation

---

## 📐 Architectural Principles

- **Referential Transparency:** Core logic is implemented as pure functions; side effects are isolated in wrapper classes. See [Referential Transparency Guide](.github/REFERENTIAL_TRANSPARENCY.md).
- **Immutability:** Data structures are not mutated in place; functions return new values. See [High Cohesion Guide](.github/HIGH_COHESION_GUIDE.md).
- **High Cohesion & Low Coupling:** Modules and classes have single, well-defined responsibilities.
- **Functional Programming:** Explicit dependencies, no hidden globals, deterministic outputs.

---

## 📦 Installation

```bash
npm install ibira.js
```

```bash
yarn add ibira.js
```

### CDN (browser)

```html
<script type="module">
  import { IbiraAPIFetcher } from 'https://cdn.jsdelivr.net/npm/ibira.js/dist/index.mjs';
</script>
```

---

## 📚 Documentation

For comprehensive documentation, guides, and resources, see **[Documentation Index](./docs/INDEX.md)** - your complete guide to the repository.

## 🎯 Overview

**ibira.js** is a JavaScript library for fetching and caching API data with observer pattern support. It provides:

- 🔄 **Observer pattern** for reactive data updates
- 💾 **Built-in LRU caching** mechanism
- 🎯 **Promise-based** async/await API
- 🛡️ **Comprehensive error handling**
- 🧩 **Low coupling and high cohesion** design
- 🧪 **Referentially transparent core logic** for testability and maintainability

## 🚀 Quick Start

```javascript
import { IbiraAPIFetcher, IbiraAPIFetchManager } from 'ibira.js';

// Simple usage with IbiraAPIFetcher
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
const data = await fetcher.fetchData();
console.log(data);

// Advanced usage with IbiraAPIFetchManager
const manager = new IbiraAPIFetchManager();
const result = await manager.fetch('https://api.example.com/data');

// Observer pattern example
fetcher.subscribe((newData) => {
  console.log('Data updated:', newData);
});
```

## 🌐 CDN Delivery (jsDelivr)

Load **ibira.js** directly from jsDelivr CDN without installation:

### HTML Script Tag

```html
<!-- Load specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/ibira.js@0.3.5-alpha/dist/index.mjs"></script>

<!-- Load with SRI (Subresource Integrity) for security -->
<script src="https://cdn.jsdelivr.net/npm/ibira.js@0.3.5-alpha/dist/index.mjs"
        integrity="sha384-HASH_HERE"
        crossorigin="anonymous"></script>
```

### ES Module Import

```html
<script type="module">
  import { IbiraAPIFetcher } from 'https://cdn.jsdelivr.net/npm/ibira.js@0.3.5-alpha/dist/index.mjs';
</script>
```

### Version Options

- **Specific version:** `@0.3.5-alpha` (recommended for production)
- **Latest patch:** `@0.3` (auto-updates to latest 0.3.x)
- **Latest minor:** `@0` (auto-updates to latest 0.x.x)
- **Latest from branch:** `@main` (development, auto-updates)

### Performance Tips

1. Always use specific versions in production (not `@latest` or branch names)
2. Enable SRI for security and cache validation
3. jsDelivr serves from 750+ CDN locations worldwide
4. Files are automatically minified and compressed (Brotli/Gzip)
5. HTTP/2 and HTTP/3 support included

For more CDN options and examples, run `./cdn-delivery.sh` or visit [jsDelivr Documentation](https://www.jsdelivr.com/?docs=gh).

## 🧪 Testing & Utilities

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run tests in Node.js environment (verifies server-side compatibility)
npm run test:node

# Validate JavaScript syntax and referential transparency
npm run validate

# Validate and run tests
npm run test:all
```

### Environments

ibira.js is isomorphic — it runs in both browser and Node.js ≥18 environments without modification. All tests pass in both runtimes:

| Environment | Command | Status |
|-------------|---------|--------|
| Browser (jsdom) | `npm test` | ✅ |
| Node.js ≥18 | `npm run test:node` | ✅ |

The library uses only platform-neutral APIs (`fetch`, `Map`, `setTimeout`, `AbortController`) available in both environments.

### Utility Scripts

#### Test Runner Helper

**Purpose:** Display available test commands and test structure
**Usage:** `./test-runner.js` or `node test-runner.js`
**Note:** Informational only - use `npm test` to run actual tests

```bash
./test-runner.js
# Output: Test commands, structure, coverage info
```

#### Pure Referential Transparency Demonstration

**Purpose:** Interactive demonstration of referential transparency principles
**Usage:** `./test_pure_fetcher.js` or `node test_pure_fetcher.js`
**Features:**

- 5 comprehensive deterministic tests
- Proves 10/10 referential transparency score
- Demonstrates zero side effects
- Shows time-travel debugging capabilities

```bash
./test_pure_fetcher.js
# Output: Live demonstration of pure functional programming
```

#### CDN Delivery Script

**Purpose:** Generate CDN URLs for ibira.js distribution
**Prerequisites:**

- Git installed and repository initialized
- Node.js and npm available
- Run from repository root

**Usage:** `./cdn-delivery.sh`
**Output:**

- CDN URLs displayed in terminal
- `cdn-urls.txt` file created with all URLs
- Latest, specific version, and minified URLs

```bash
./cdn-delivery.sh
# Output: CDN URLs + cdn-urls.txt file
```

**Troubleshooting:**

- If git not found: `sudo apt-get install git` (Linux) or `brew install git` (macOS)
- If permission denied: `chmod +x cdn-delivery.sh`
- If version mismatch: Commit and push latest changes first

#### Deploy Script

**Purpose:** Tag a release, push to remote, and regenerate CDN URLs
**Prerequisites:**

- Clean git working tree (no uncommitted changes)
- Git remote `origin` configured and writable
- Tests must pass (script runs them automatically before tagging)
- Node.js and npm available

**Usage:** `./scripts/deploy.sh [version]`

- If `[version]` is omitted the version from `package.json` is used.

**Exit codes:** `0` success · `1` dirty tree · `2` tests failed · `3` tag exists · `4` push failed

```bash
# Deploy current package.json version
./scripts/deploy.sh

# Deploy a specific version
./scripts/deploy.sh 0.3.0-alpha
# Output: annotated git tag pushed to origin; cdn-urls.txt regenerated
```

**Troubleshooting:**

- If permission denied: `chmod +x scripts/deploy.sh`
- If tests fail: fix failing tests before deploying
- If tag already exists: bump the version in `package.json` first

#### Deploy Script

**Purpose:** Tag a release, push to remote, and regenerate CDN URLs
**Prerequisites:**

- Clean git working tree (no uncommitted changes)
- Git remote `origin` configured and writable
- Tests must pass (runs automatically before tagging)
- Node.js and npm available

**Usage:** `./scripts/deploy.sh [version]`

- If `[version]` is omitted the version from `package.json` is used.

**Output:** Annotated git tag pushed to origin; `cdn-urls.txt` regenerated

**Exit codes:**

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Working tree is dirty |
| `2` | Tests failed |
| `3` | Tag already exists |
| `4` | Push to remote failed |

```bash
# Deploy current package.json version
./scripts/deploy.sh

# Deploy a specific version
./scripts/deploy.sh 0.3.0-alpha
```

## 📖 Key Resources

- **[Complete Documentation Index](./docs/INDEX.md)** - All guides and documentation
- **[JavaScript Best Practices](./.github/JAVASCRIPT_BEST_PRACTICES.md)** - Coding standards
- **[TDD Guide](./.github/TDD_GUIDE.md)** - Test-driven development
- **[Referential Transparency](./.github/REFERENTIAL_TRANSPARENCY.md)** - Pure functions guide

## 🤝 Contributing

Please read our comprehensive guides before contributing:

1. [JavaScript Best Practices](./.github/JAVASCRIPT_BEST_PRACTICES.md)
2. [TDD Guide](./.github/TDD_GUIDE.md)
3. [Code Review Guide](./.github/CODE_REVIEW_GUIDE.md)

See the full [Documentation Index](./docs/INDEX.md) for all available resources.

## 📝 License

MIT License - Copyright (c) 2025 Marcelo Pereira Barbosa

## 🔗 Links

- **Repository:** https://github.com/mpbarbosa/ibira.js
- **Documentation Index:** [INDEX.md](./docs/INDEX.md)
