# ibira.js Roadmap

> **Current version:** 0.4.13-alpha — v0.4.x Beta Preparation in progress
> **Status:** Active development — retry loop wired, `throttle`/`debounce` utilities shipped; several v0.4.x items remain

This roadmap evolves alongside the project. Priorities may shift based on feedback and usage patterns.

---

## ✅ Completed

| Version | Highlights |
|---------|-----------|
| **0.1.0-alpha** | Core fetcher, observer pattern, LRU cache, exponential backoff retry, referential transparency (10/10) |
| **0.2.0-alpha** | Modular architecture (`core/`, `utils/`, `config/`), 152 tests, 90%+ coverage |
| **0.2.1-alpha** | jsDelivr CDN delivery, SRI support, CDN URL generator script |
| **0.2.2-alpha** | `.workflow-config.yaml` corrections, `copilot-instructions.md` |
| **0.3.0-alpha** | ESLint, AbortController, `validateStatus`, branch coverage 90%+, deploy script, API review |
| **0.3.6-alpha** | Version sync, observer error isolation, broken doc cross-refs fixed, test quality hardening |
| **0.4.13-alpha** | Request/response interceptors, pluggable retry strategy, `DefaultCache<T>` generics, TypeScript ESLint coverage, 251 tests |

---

## ✅ v0.3.x — Alpha Hardening (complete)

- [x] **`ai-workflow deploy` integration** — `scripts/deploy.sh` created; `.workflow-config.yaml` updated
- [x] **ESLint configuration** — `eslint.config.mjs` flat config; `npm run lint` script
- [x] **Branch coverage to 90%+** — raised from 82% to 91.75% (IbiraAPIFetcher), 86.95% (Manager)
- [x] **`AbortController` support** — `signal` option on `fetchData()` and `fetchDataPure()`
- [x] **`validateStatus` option** — `(status: number) => boolean` on `FetcherOptions`
- [x] **API surface review** — public exports audited; backward-compatible; documented
- [x] **CHANGELOG for 0.2.2-alpha** — entry added

---

## 🔧 Developer Experience

Low-priority housekeeping items that improve contributor experience without changing library behaviour.

- [x] **Share `.vscode/settings.json`** — unignore via `.gitignore` exception (`!.vscode/settings.json`)
  so contributors automatically get the project's cSpell word list and any future editor settings;
  add `.vscode/extensions.json` recommending ESLint and cSpell extensions
- [x] **`.ai_workflow/` README** — add `.ai_workflow/README.md` documenting the purpose of the
  AI workflow automation directory and explaining that its contents are tooling artifacts (not
  library code) so contributors know to leave it alone
- [x] **Version consistency automation** — `scripts/sync-version.js` reads `package.json` and regenerates `src/config/version.ts` atomically; `npm run version:sync` and `npm run version:check` scripts added; `version:check` wired into `test:all` to catch drift in CI
- [ ] **Test suite refactoring** — extract repeated setup (cache factories, URL constants, mock
  observers) to shared helpers; convert parallel edge-case tests to `it.each` parameterised tables;
  rename any remaining implementation-focused test names to behaviour-focused names (e.g.
  "should store and retrieve null values" rather than "should handle null values"); prefer specific
  Jest matchers (`toBeUndefined`, `toBeNull`, `toHaveLength`, `toBeInstanceOf`, `toHaveBeenCalledTimes`,
  `toHaveBeenCalledWith`) over generic `toEqual`; use `.resolves`/`.rejects` for async assertions;
  ensure all mocks and timers are reset in `afterEach` for test isolation
- [ ] **Integration & e2e test layer** — the current suite is unit-heavy (6 files, 1 directory);
  add integration tests covering cross-module flows (`IbiraAPIFetchManager` ↔ `DefaultCache` ↔
  `DefaultEventNotifier`) and at least one e2e scenario exercising the full fetch-cache-notify
  pipeline; maintain the test pyramid (unit → integration → e2e) as the codebase grows
- [ ] **Version test consolidation** _(step_06)_ — `test/config/version.test.js` deleted (duplicate
  of `version.test.ts`; anti-pattern custom `toString` overrides removed); remaining work: move
  `test/config/version.test.ts` to `__tests__/` for consistent test location, and refactor
  prerelease-variation tests to `it.each` parameterised table with a `makeVersion(overrides)` helper
- [ ] **`version.ts toString()` SemVer compliance** _(step_10)_ — when `prerelease` is empty,
  `toString()` currently outputs a trailing hyphen (e.g. `"0.4.1-"`), which is not valid SemVer.
  Change to omit the hyphen when `prerelease === ''` so output is `"0.4.1"`. Requires updating the
  corresponding test assertion in `test/config/version.test.ts` (the "empty prerelease" case) and
  updating `generateVersionTs()` in `scripts/sync-version.js` to match the new behaviour.
- [ ] **`sync-version.js` NaN guard** _(step_10)_ — after `core.split('.').map(Number)`, add
  `if (isNaN(major) || isNaN(minor) || isNaN(patch)) throw new Error(...)` so a malformed
  `package.json` version (e.g. `"x.y.z"`) produces a clear error instead of silently writing
  `NaN.NaN.NaN-alpha` to `version.ts`.
- [ ] **Automated dependency management** _(step_09)_ — enable Dependabot or Renovate for automated
  PR-based dependency updates; add `npm audit` as a CI step; document in `CONTRIBUTING.md` that
  `package-lock.json` must be committed; pin critical tooling versions (`typescript`, `jest`,
  `ts-jest`) for reproducible builds across contributors
- [ ] **Prettier integration** — add `.prettierrc` config file and ensure ESLint and Prettier configs
  do not conflict (install `eslint-config-prettier`); document formatting step in `CONTRIBUTING.md`
  (`npm run format` script and `prettier` devDependency already added in v0.4.x)
- [ ] **Markdown quality hardening** — 2786 linting violations remain across 43 docs after bulk-fixing
  trailing spaces (MD009) and final newlines (MD047); manually review and fix nested list indentation
  (MD007) and headers ending with punctuation (MD026); integrate `markdownlint-cli` as a pre-commit
  hook (Husky) and CI step to prevent regressions; add `docs/MARKDOWN_LINTING_GUIDE.md` for
  contributors
- [ ] **Cache cleanup scalability review** — profile the periodic cleanup interval
  (`_startPeriodicCleanup`) under high-load scenarios (many concurrent URLs, large TTL spreads);
  consider a lazy / on-demand eviction strategy for environments where `setInterval` is costly
- [ ] **Edge-case documentation** — expand JSDoc and `docs/` to explicitly cover: cache overflow
  behaviour (what happens when `maxSize` is reached mid-burst), retry exhaustion (what the caller
  receives after all retries fail), and observer error isolation (does one subscriber's throw
  prevent others from being notified)
- [ ] **`docs/INDEX.md` CDN & versioning refresh** — update CDN URLs and version references in
  `docs/INDEX.md` to point to npm-based delivery (`cdn.jsdelivr.net/npm/ibira.js@…/dist/index.mjs`)
  now that the package is published; verify all cross-links remain valid
- [ ] **`docs/FUNCTIONAL_REQUIREMENTS.md` API alignment** — review and update to reflect current
  API surface (HTTP methods beyond GET, `validateStatus`, `AbortController` signal) and CDN usage
  patterns introduced in v0.4.x
- [ ] **`docs/ARCHITECTURE.md` TypeScript update** — update to reflect TypeScript source migration,
  new `tsconfig.json` / tsup build pipeline, and the `dist/` output structure (CJS + ESM + `.d.ts`)
- [ ] **`__tests__/README.md` dual-environment expansion** — expand to document dual-environment
  testing requirements (Node.js ≥18 + jsdom), new test modules (`DefaultCache`, `DefaultEventNotifier`),
  and the `npm run test:node` script
- [ ] **Referential transparency docs cross-linking** — add explicit cross-links between the five
  related referential transparency documents (`docs/REFERENTIAL_TRANSPARENCY.md`,
  `.github/REFERENTIAL_TRANSPARENCY.md`, `docs/referential_transparency/REFERENTIAL_TRANSPARENCY.md`,
  `docs/referential_transparency/PURE_SOLUTION.md`,
  `docs/referential_transparency/VERIFICATION_REPORT.md`) so readers can navigate between them
- [ ] **Script best-practice documentation** — add a brief "Script Best Practices" note to
  `docs/ARCHITECTURE.md` (or README.md) covering: executable permissions (`chmod +x`), shebang
  presence, required environment variables, and expected exit codes for `cdn-delivery.sh` and
  `scripts/deploy.sh`; also note each script's expected stdout output and return values

- [ ] **Undocumented docs subdirectories** — 12 subdirectories under `docs/` and `.github/` lack a
  `README.md` or `index.md` explaining their purpose (`.github/ISSUE_TEMPLATE`,
  `.github/workflows`, `docs/architecture`, `docs/misc`, `docs/prompts`, `docs/reference`,
  `docs/referential_transparency`, `docs/reports`, `docs/reports/analysis`,
  `docs/reports/bugfixes`, `docs/testing`, `docs/workflow-automation`); add a minimal
  `README.md` to each so contributors understand what belongs where
- [x] **`@typescript-eslint` rule review** — `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` added; `eslint.config.mjs` now covers `src/**/*.ts` and `test/**/*.ts`; `no-explicit-any: 'error'` and `no-unused-vars` TypeScript variant are active
- [ ] **`cdn-delivery.sh` helper functions** — extract ANSI color codes and repeated `echo`/log
  patterns into small named helper functions for easier maintenance as the script grows

---

## 🔜 v0.4.x — Beta Preparation

Goal: make ibira.js usable beyond CDN delivery, including as an npm dependency for TypeScript projects.

### Market context

Existing public packages (`p-retry` ~32M DLs/week, `ky` ~2M DLs/week) cover retry and HTTP
individually — both are TypeScript-native. ibira.js's genuine differentiator is the **combination**
of LRU cache + retry + observer pattern in a single, isomorphic package. No public package covers
all three. Prioritising TypeScript migration and Node.js support makes that niche viable.

### Items

- [x] **TypeScript source migration** — convert `IbiraAPIFetcher.js`, `DefaultCache.js`,
  `DefaultEventNotifier.js` to `.ts`; add `tsconfig.json` targeting `ES2022` with
  `"lib": ["ES2022", "DOM"]`, `strict: true`, `declaration: true`; replace Babel with `ts-jest`;
  ship generated `.d.ts` files in `dist/`. Native interfaces replace JSDoc `@typedef`:
  `FetcherOptions`, `FetchResult<T>`, `CacheEntry`, `Observer`
- [x] **Node.js ≥ 18 dual support** — ibira.js source already uses zero browser APIs
  (`window`, `document`, CORS `mode:` absent; pure `fetch` + `Map` + observer); formalise
  Node.js support by adding `"engines": { "node": ">=18" }` and a second jest config:
  `jest.browser.config.js` (`testEnvironment: jsdom`) and `jest.node.config.js`
  (`testEnvironment: node`); all 152 tests expected to pass unmodified in both environments
- [x] **npm publication** — register package on npmjs.com; add GitHub Actions publish workflow
  triggered on version tags; update install instructions
- [x] **CJS + ESM dual build** — emit both `dist/index.cjs` and `dist/index.mjs` for maximum
  compatibility; add `exports` field to `package.json` with `"."` and `"./cache"` sub-paths
- [x] **HTTP methods beyond GET** — `POST`, `PUT`, `PATCH`, `DELETE` support with configurable
  body serialization

- [x] **Wire retry loop into `fetchData()`** _(high-priority bug, step_18)_ — Private methods
  `_isRetryableError()`, `_calculateRetryDelay()`, and `_sleep()` were fully implemented and
  unit-tested but never called. The retry loop now runs up to `maxRetries` attempts with
  exponential backoff; externally-aborted requests are not retried; `options.maxRetries ?? 3`
  replaces `||` so `0` correctly disables retries; 11 new tests cover all retryable status codes
  (408/429/500–504), observer notification per attempt, `maxRetries: 0`, and successful mid-retry
  recovery.
- [x] **`throttle()` and `debounce()` utilities** — generic higher-order functions exported from
  `src/utils/throttle.ts` and `src/utils/debounce.ts`; both re-exported from `src/index.ts`.
  `throttle(fn, wait)` uses a leading-edge strategy and exposes `flush()` to reset the cooldown.
  `debounce(fn, wait)` uses a trailing-edge strategy; all callers in the same window share a single
  `Promise` so every `await debouncedFetch()` resolves together; exposes `cancel()` and `flush()`;
  works with sync and async wrapped functions. 30 new tests across two files.
- [x] **Stricter generics** — `DefaultCache<T = unknown>` and `CacheEntry<T = unknown>` parameterised; `CacheInterface<T>` exported publicly from `src/index.ts`; end-to-end type inference for cached values; all existing call sites remain valid (default `= unknown`)

### Pipeline customisation

Goal: let consumers customise the request/response pipeline.

- [x] **Request interceptors** — `onRequest?: (options: RequestInit) => RequestInit | Promise<RequestInit>` on `FetcherOptions`; called before every `fetch()` call; async-safe; throwing interceptor propagates through the retry loop; 5 new tests
- [x] **Response interceptors** — `onResponse?: (response: Response) => Response | Promise<Response>` on `FetcherOptions`; called after `fetch()`, before status validation; async-safe; throwing interceptor surfaces as fetch error; 4 new tests
- [x] **Pluggable cache backends** — `CacheInterface<T>` exported publicly from `src/index.ts`; consumers can provide any duck-typed cache adapter (localStorage, IndexedDB, Redis) via `IbiraAPIFetcher.withCustomCache()`
- [x] **Pluggable retry strategies** — `retryStrategy?: (attempt: number, error: Error) => boolean` on `FetcherOptions`; replaces `_isRetryableError` when provided; default exponential backoff unchanged; 5 new tests
- [x] **Async error propagation audit** — all `fetch` call sites in `IbiraAPIFetcher` and `IbiraAPIFetchManager` confirmed to have explicit `try/catch`; error surfaces to caller via `throw`; documented in JSDoc `@throws`
- [ ] **Result/Either pattern for fetch operations** — replace throw-based error handling with `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` for explicit, type-safe error paths; consumers no longer need try/catch at call sites
- [ ] **Runtime API response validation** — integrate a validation library (Zod or io-ts) to narrow `unknown` API responses to typed shapes at runtime; prevents type assertion bugs from unpredictable external payloads
- [x] **Import `ObserverSubject` pattern from `bessa_patterns.ts`** — `DefaultEventNotifier` now delegates to `DualObserverSubject` (v0.12.12-alpha) from the `bessa_patterns.ts` project via composition; bundled into the ibira.js dist (zero peer dependencies) via `noExternal` tsup config. CDN URL: `https://cdn.jsdelivr.net/gh/mpbarbosa/bessa_patterns.ts@v0.12.12-alpha/dist/index.mjs`

---

## 🎯 v1.0.0 — Stable Release

Goal: production-ready, semantically stable public API.

- [ ] All `v0.x` features finalised and documented
- [x] Full TypeScript strict-mode compatibility
- [ ] 95%+ test coverage across all metrics
- [ ] Performance benchmarks published in `docs/`
- [ ] **Performance monitoring hooks** — add optional hooks for observability metrics (fetch timing, cache hit/miss rate, retry counts) to support profiling and future scalability analysis
- [ ] `MIGRATION.md` updated for any breaking changes from alpha
- [ ] `SECURITY.md` and responsible-disclosure process
- [x] Automated npm publish via GitHub Actions on tagged releases

---

## 🔭 v2.x — Framework Integrations

Longer-horizon items; scoped after v1.0 stabilises.

- [ ] **React hooks** — `useFetch(url, options)`, `useFetchManager()` with suspense support
- [ ] **Vue composable** — `useFetch()` for Vue 3 Composition API
- [ ] **Offline / Service Worker mode** — cache-first strategy with background revalidation
- [ ] **GraphQL support** — first-class `query`/`mutation` helpers alongside REST
- [ ] **WebSocket support** — persistent connection management with the existing observer pattern

---

## 🗓 Versioning Policy

ibira.js follows [Semantic Versioning](https://semver.org/):

- **0.x.y-alpha** — API may break between minor versions; not for production
- **0.x.y-beta** — API is stabilising; breaking changes communicated in CHANGELOG
- **1.0.0+** — Stable; breaking changes only in major versions

---

## 💬 Feedback

Open an issue or start a discussion in the repository to propose features, report gaps, or vote on priorities.

---

## 🔧 Roadmap — Minor Issues (audit-and-fix)

| ID | Source step | Description | File/Path | Priority | Status |
|----|-------------|-------------|-----------|----------|--------|
| RI-006 | workflow_20260325_172923 / step_07 | `__tests__/README.md` structure diagram missing `test/scripts/sync-version.test.js` | `__tests__/README.md` | Low | ✅ done |
| RI-007 | validate-logs audit | MD026 trailing `?` in 39 FAQ.md section headers | `docs/FAQ.md` | Low | ✅ done |
| RI-008 | validate-logs audit | MD031 missing blank lines around 26 fenced code blocks | `docs/IBIRA_API_FETCHER.md` | Low | ✅ done |
