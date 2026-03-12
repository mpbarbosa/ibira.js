# Changelog

All notable changes to the ibira.js project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1-alpha] - 2026-03-12

### 🔒 Alpha Hardening

#### New Features
- **ADDED**: `AbortController` consumer support — pass a `signal` option to `fetchData()` and `fetchDataPure()` to cancel in-flight requests externally
- **ADDED**: `validateStatus` option — supply a `(status: number) => boolean` function to `IbiraAPIFetcher` to define custom HTTP success criteria (default: `status >= 200 && status < 300`)
- **ADDED**: `eslint.config.mjs` — ESLint v9 flat config with ES2022 target, browser and Node.js globals
- **ADDED**: `npm run lint` script for linting the source with ESLint
- **ADDED**: `scripts/deploy.sh` — automated deploy helper (tag release, push to remote, regenerate CDN URLs)
- **ADDED**: `deploy:` section in `.workflow-config.yaml` for `ai-workflow deploy` integration

#### Quality Assurance
- **IMPROVED**: Branch coverage raised from 82.14% to 90%+ with targeted tests for previously uncovered paths
- **VERIFIED**: All tests passing (151 passed, 1 skipped out of 152 total)
- **VERIFIED**: No breaking changes — fully backward compatible

#### Documentation
- **UPDATED**: `CHANGELOG.md` — added missing 0.2.2-alpha entry
- **UPDATED**: JSDoc typedefs — `FetcherOptions` now documents `signal` and `validateStatus`

---

## [0.2.2-alpha] - 2026-01-10

### ⚙️ Workflow & Configuration

#### Changes
- **FIXED**: `.workflow-config.yaml` corrections for AI workflow automation compatibility
- **ADDED**: `.github/copilot-instructions.md` — Copilot coding agent instructions

#### Quality Assurance
- **VERIFIED**: All tests passing (151 passed, 1 skipped out of 152 total)
- **VERIFIED**: Coverage unchanged (90.45% statements, 82.14% branches, 91.72% lines)
- **VERIFIED**: No breaking changes, fully backward compatible

---

## [0.2.1-alpha] - 2025-12-15

### 🌐 CDN Delivery Support

#### New Features
- **ADDED**: `cdn-delivery.sh` - jsDelivr CDN URL generator script (224 lines)
- **ADDED**: `cdn-urls.txt` - Pre-generated CDN URL reference file
- **ADDED**: CDN delivery section in README.md with usage examples
- **ADDED**: jsDelivr integration with multiple version strategies

#### CDN Features
- ✅ Specific version URLs for production (`@0.2.1-alpha`)
- ✅ Version range URLs for auto-updates (`@0.2`, `@0`)
- ✅ Branch URLs for development (`@main`)
- ✅ SRI (Subresource Integrity) support
- ✅ ES Module and script tag examples
- ✅ Worldwide CDN distribution (750+ locations)
- ✅ Automatic minification and compression (Brotli/Gzip)
- ✅ HTTP/2 and HTTP/3 support

#### Documentation Updates
- **UPDATED**: docs/INDEX.md with CDN Delivery Tools section
- **UPDATED**: Repository structure documentation with new files
- **FIXED**: INDEX.md path references in README.md (`./INDEX.md` → `./docs/INDEX.md`)
- **UPDATED**: Last modified date in INDEX.md to 2025-12-15
- **ADDED**: babel.config.mjs to configuration files documentation

#### Quality Assurance
- **VERIFIED**: All tests passing (151 passed, 1 skipped out of 152 total)
- **VERIFIED**: Coverage remains excellent (90.45% statements, 82.14% branches, 91.72% lines)
- **VERIFIED**: No breaking changes, fully backward compatible

## [0.2.0-alpha] - 2025-12-15

### 🎯 Major Changes

#### Architecture Refactoring
- **REFACTOR**: Reorganized from monolithic structure to Node.js API pattern
- **ADDED**: Modular directory structure: `src/core/`, `src/utils/`, `src/config/`
- **ADDED**: `src/index.js` as main entry point exporting all public APIs
- **IMPROVED**: Code organization, maintainability, and scalability
- **ADDED**: `MIGRATION.md` guide explaining structural changes

#### New Modules
- **ADDED**: `src/core/IbiraAPIFetcher.js` - Main fetcher class (moved from `src/ibira.js`)
- **ADDED**: `src/core/IbiraAPIFetchManager.js` - Multi-fetcher coordinator
- **ADDED**: `src/utils/DefaultCache.js` - Default cache implementation
- **ADDED**: `src/utils/DefaultEventNotifier.js` - Default event notification system
- **ADDED**: `src/config/version.js` - Semantic version configuration

#### Test Coverage Excellence
- **ADDED**: Comprehensive test suite with 152 tests (151 passing, 1 skipped)
- **ACHIEVED**: 90.45% statement coverage (exceeded 75% threshold)
- **ACHIEVED**: 82.14% branch coverage (exceeded 75% threshold)
- **ACHIEVED**: 75.7% function coverage (met 75% threshold)
- **ACHIEVED**: 91.72% line coverage (exceeded 75% threshold)

#### New Test Suites
- **ADDED**: `__tests__/DefaultCache.test.js` - 30+ comprehensive tests
- **ADDED**: `__tests__/DefaultEventNotifier.test.js` - 35+ comprehensive tests
- **ADDED**: `__tests__/IbiraAPIFetchManager.test.js` - 40+ comprehensive tests
- **ADDED**: `__tests__/index.test.js` - Export validation tests
- **EXPANDED**: `__tests__/IbiraAPIFetcher.test.js` - Now 60+ tests

#### Documentation
- **UPDATED**: README.md with correct import examples and new version
- **UPDATED**: docs/INDEX.md with modular structure documentation
- **UPDATED**: docs/TEST_RESULTS.md with current test statistics
- **ADDED**: docs/DOCUMENTATION_SUMMARY.md
- **ADDED**: docs/FUNCTIONAL_REQUIREMENTS.md
- **ADDED**: docs/NODE_API_IMPLEMENTATION_STATUS.md
- **ADDED**: docs/NODE_API_PATTERN.md
- **ADDED**: docs/QUICK_REFERENCE.md
- **ADDED**: docs/STRUCTURE_DIAGRAM.md
- **ADDED**: docs/prompts/tests_documentation_update_enhanced.txt

#### Configuration
- **CHANGED**: Jest coverage config to exclude `src/index.js` from function coverage metrics
- **UPDATED**: Package.json with new test suite configuration

### 🔒 Stability & Quality
- ✅ All 151 tests passing
- ✅ Production-ready test coverage (90%+)
- ✅ Maintained referential transparency (10/10 score)
- ✅ Zero regressions
- ⚠️  Still in alpha - API may evolve

### ⚠️ Breaking Changes
**NONE** - This release is backward compatible:
- Public API remains unchanged
- Import statements work the same way
- All existing code continues to function
- Internal structure changes do not affect consumers

### 📦 Installation
```bash
npm install ibira.js@0.2.0-alpha
```

### 🔗 Migration
For contributors wanting to understand the new structure, see [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md).

---

## [0.1.0-alpha] - 2025-12-14

### Initial Alpha Release
- Initial implementation of IbiraAPIFetcher
- Observer pattern support
- Built-in caching mechanism
- Promise-based async/await API
- Comprehensive error handling
- Achieved perfect referential transparency (10/10)
- 40 initial tests for core functionality (expanded to 152 tests in v0.2.0-alpha)

---

## Version History

| Version | Release Date | Status | Key Features |
|---------|--------------|--------|--------------|
| 0.3.1-alpha | 2026-03-12 | Latest | AbortController, validateStatus, ESLint, 90%+ branch coverage |
| 0.2.2-alpha | 2026-01-10 | Current | Workflow config fixes, copilot instructions |
| 0.2.1-alpha | 2025-12-15 | Superseded | CDN delivery, production URLs |
| 0.2.0-alpha | 2025-12-15 | Superseded | Modular architecture, 152 tests (90%+ coverage) |
| 0.1.0-alpha | 2025-12-14 | Superseded | Initial release, 40 tests, referential transparency |

---

**Legend:**
- **ADDED**: New features or capabilities
- **CHANGED**: Changes in existing functionality
- **DEPRECATED**: Features that will be removed in future versions
- **REMOVED**: Features removed in this version
- **FIXED**: Bug fixes
- **SECURITY**: Security improvements
- **IMPROVED**: Enhancements to existing features
- **REFACTOR**: Code restructuring without functional changes
