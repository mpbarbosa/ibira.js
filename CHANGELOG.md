# Changelog

All notable changes to the ibira.js project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.4.14-alpha] — 2026-03-17

### 🚀 New Features (Pipeline Customisation)

- **ADDED**: `onRequest` interceptor — `FetcherOptions.onRequest?: (options: RequestInit) => RequestInit | Promise<RequestInit>`; called before every `fetch()` call; supports async; throwing interceptor propagates through the retry loop
- **ADDED**: `onResponse` interceptor — `FetcherOptions.onResponse?: (response: Response) => Response | Promise<Response>`; called after `fetch()`, before status validation; supports async; throwing interceptor surfaces as fetch error
- **ADDED**: Pluggable retry strategy — `FetcherOptions.retryStrategy?: (attempt: number, error: Error) => boolean`; replaces the built-in `_isRetryableError` when provided; default exponential backoff unchanged
- **ADDED**: `DefaultCache<T>` generics — `CacheEntry<T = unknown>` and `DefaultCache<T = unknown>` parameterised; `CacheInterface<T>` exported publicly from `src/index.ts` for custom cache adapters
- **ADDED**: TypeScript ESLint coverage — `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` added; `eslint.config.mjs` now covers `src/**/*.ts` and `test/**/*.ts`; `no-explicit-any: 'error'` active
- **ADDED**: `scripts/sync-version.js` — regenerates `src/config/version.ts` from `package.json`; `npm run version:sync` and `npm run version:check` scripts; `version:check` wired into `test:all` for CI drift detection
- **ADDED**: 18 new tests for interceptors and retryStrategy (251 total; 1 pre-existing skip)

### 🐛 Bug Fixes

- **FIXED**: `IbiraAPIFetcher._isCacheEntryValid()` — changed `!= null` to strict `!== null && !== undefined` (eqeqeq)
- **FIXED**: `IbiraAPIFetchManager._isCacheEntryValid()` — same eqeqeq fix
- **FIXED**: Removed unused `CacheInterface` import from `IbiraAPIFetchManager.ts`

### 📚 Documentation

- **UPDATED**: `README.md` — "Zero-dependency" claim updated to "no peer dependencies required" (runtime dependency on `bessa_patterns.ts` is bundled)
- **UPDATED**: ROADMAP.md — v0.4.14-alpha items marked complete; completed table updated

### ⬆️ v0.4.x Beta Preparation (earlier entries)

### 🚀 New Features

- **ADDED**: HTTP methods beyond GET — `method`, `body`, and `headers` options on `FetcherOptions`; plain-object bodies auto-serialized to JSON with `Content-Type: application/json`; cache key is now `METHOD:url` so GET and POST requests cache independently
- **ADDED**: Node.js ≥18 dual support — `jest.node.config.mjs` confirms all 200 tests pass in both browser (jsdom) and Node.js environments; `npm run test:node` script added
- **ADDED**: TypeScript source migration — all `src/**/*.js` converted to strict-mode `.ts`; `tsconfig.json` (ES2022, strict, declaration); ts-jest replaces Babel for source transformation; native TypeScript interfaces (`FetcherOptions`, `FetchResult`, `CacheEntry`, `Observer`, `CacheOperation`, `FetchEvent`, `FetchMeta`) exported from `dist/index.d.ts`
- **ADDED**: CJS + ESM dual build via tsup — `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types); `exports` field in `package.json` for proper Node.js/bundler resolution; `npm run build` script; `prepublishOnly` runs validate + test + build
- **ADDED**: Updated CDN delivery — jsDelivr URLs now reference `dist/index.mjs` and version `0.4.14-alpha` for both script and module usage; documentation and examples updated accordingly
- **ADDED**: Expanded test suite — `__tests__/DefaultCache.test.js`, `__tests__/DefaultEventNotifier.test.js`, `__tests__/IbiraAPIFetchManager.test.js`, `__tests__/IbiraAPIFetcher.test.js` cover new caching and event notifier logic
- **ADDED**: `DefaultCache` and `DefaultEventNotifier` utilities — `src/utils/` modules migrated to strict TypeScript, fully documented and tested
- **ADDED**: `IbiraAPIFetchManager` and `IbiraAPIFetcher` refactored to TypeScript — improved type safety, API surface, and JSDoc coverage
- **ADDED**: `src/config/version.ts` — centralizes version management for build and runtime consistency

### 🛠️ Improvements

- **IMPROVED**: Documentation consistency — `README.md`, CDN examples, API usage, and architectural principles updated to match new build outputs, referential transparency, and versioning
- **IMPROVED**: Project structure — all source files migrated to TypeScript; build and test scripts updated for new structure
- **IMPROVED**: Linting and formatting — ESLint and Prettier configs updated for strict TypeScript and Node.js 18+ compatibility

### 🐛 Bug Fixes (TypeScript Migration)

- **FIXED**: Observer error isolation in `DefaultEventNotifier`
- **FIXED**: Caching logic edge cases in `DefaultCache`

### 📚 Documentation (TypeScript Migration)

- **UPDATED**: `.github/REFERENTIAL_TRANSPARENCY.md` — expanded referential transparency guidance for reviewers and contributors
- **UPDATED**: `.github/HIGH_COHESION_GUIDE.md` — new high cohesion principles and examples for configuration and workflows
- **UPDATED**: `CONTRIBUTING.md` — developer setup, code standards, testing, PR flow
- **UPDATED**: `__tests__/README.md` — test naming, mocking patterns, coverage targets
- **UPDATED**: `docs/ARCHITECTURE.md` — new modules and build process
- **UPDATED**: `docs/INDEX.md`, `docs/FUNCTIONAL_REQUIREMENTS.md` — reflect new utilities and API changes

---

## [0.3.6-alpha] - 2026-03-12

### 🔒 Alpha Hardening

#### New Features

- **ADDED**: `AbortController` consumer support — pass a `signal` option to `fetchData()` and `fetchDataPure()` to cancel in-flight requests externally
- **ADDED**: `validateStatus` option — supply a `(status: number) => boolean` function to `IbiraAPIFetcher` to define custom HTTP success criteria (default: `status >= 200 && status < 300`)
- **ADDED**: `eslint.config.mjs` — ESLint v9 flat config with ES2022 target, browser and Node.js globals
- **ADDED**: `npm run lint` script for linting the source with ESLint
- **ADDED**: `scripts/deploy.sh` — automated deploy helper (tag release, push to remote, regenerate CDN URLs)
- **ADDED**: `deploy:` section in `.workflow-config.yaml` for `ai-workflow deploy` integration
- **ADDED**: `engines` field in `package.json` — formalises Node.js ≥18 minimum requirement
- **FIXED**: Observer error isolation — `DefaultEventNotifier.notify()` now wraps each subscriber call in try/catch; a throwing observer no longer silently drops notifications to subsequent subscribers

#### Quality Assurance

- **IMPROVED**: Branch coverage raised from 82.14% to 91.75% (IbiraAPIFetcher), 86.95% (IbiraAPIFetchManager) with targeted tests
- **VERIFIED**: All tests passing (184 passed, 1 skipped, 185 total after post-tag hardening)
- **VERIFIED**: No breaking changes — fully backward compatible

#### Bug Fixes

- **FIXED**: `test/config/version.test.js` import path (`'../src/config/version'` → `'../../src/config/version'`) and stale version assertions
- **FIXED**: `console.error/warn` mocks in `IbiraAPIFetcher.test.js` and `IbiraAPIFetchManager.test.js` converted from direct assignment to `jest.spyOn` for proper teardown
- **FIXED**: `src/workflow/metrics/` AI tooling artifacts removed from source tree; `src/workflow/` added to `.gitignore`

#### Documentation

- **UPDATED**: `CHANGELOG.md` — added missing 0.2.2-alpha entry
- **UPDATED**: JSDoc typedefs — `FetcherOptions` now documents `signal` and `validateStatus`
- **CREATED**: `CONTRIBUTING.md` — developer setup, code standards, testing, PR flow
- **CREATED**: `__tests__/README.md` — test naming, mocking patterns, coverage targets
- **FIXED**: 27 broken cross-references across 12 documentation files
- **UPDATED**: `README.md` — added `scripts/deploy.sh` documentation; fixed version header
- **UPDATED**: `docs/ARCHITECTURE.md` — added Automation Scripts section

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
| 0.3.6-alpha | 2026-03-12 | Latest | AbortController, validateStatus, ESLint, 90%+ branch coverage |
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
