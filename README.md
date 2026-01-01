# ibira.js

> Biblioteca JavaScript pública com código para operações básicas como fetch em APIs

**Version:** 0.2.1-alpha  
**Status:** 🚧 Early Development

---

## 📚 Documentation

For comprehensive documentation, guides, and resources, see **[Documentation Index](./docs/INDEX.md)** - your complete guide to the repository.

## 🎯 Overview

**ibira.js** is a JavaScript library for fetching and caching API data with observer pattern support. It provides:

- 🔄 **Observer pattern** for reactive data updates
- 💾 **Built-in caching** mechanism
- 🎯 **Promise-based** async/await API
- 🛡️ **Comprehensive error handling**
- 🧩 **Low coupling and high cohesion** design

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
```

## 🌐 CDN Delivery (jsDelivr)

Load **ibira.js** directly from jsDelivr CDN without installation:

### HTML Script Tag

```html
<!-- Load specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/mpbarbosa/ibira.js@0.2.1-alpha/src/index.js"></script>

<!-- Load with SRI (Subresource Integrity) for security -->
<script src="https://cdn.jsdelivr.net/gh/mpbarbosa/ibira.js@0.2.1-alpha/src/index.js"
        integrity="sha384-HASH_HERE"
        crossorigin="anonymous"></script>
```

### ES Module Import

```html
<script type="module">
  import { IbiraAPIFetcher } from 'https://cdn.jsdelivr.net/gh/mpbarbosa/ibira.js@0.2.1-alpha/src/index.js';
</script>
```

### Version Options

- **Specific version:** `@0.2.1-alpha` (recommended for production)
- **Latest patch:** `@0.2` (auto-updates to latest 0.2.x)
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

# Validate JavaScript syntax
npm run validate

# Validate and run tests
npm run test:all
```

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
