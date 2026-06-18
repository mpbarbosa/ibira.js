# ibira.js Roadmap

> **Current version:** 0.4.22-alpha — v0.4.x Beta Preparation in progress
> **Status:** Active development — retry loop wired, `throttle`/`debounce` utilities shipped; several v0.4.x items remain

This roadmap evolves alongside the project. Priorities may shift based on feedback and usage patterns.

---

## ✅ Completed

| Version          | Highlights                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **0.1.0-alpha**  | Core fetcher, observer pattern, LRU cache, exponential backoff retry, referential transparency (10/10)                     |
| **0.2.0-alpha**  | Modular architecture (`core/`, `utils/`, `config/`), 152 tests, 90%+ coverage                                              |
| **0.2.1-alpha**  | jsDelivr CDN delivery, SRI support, CDN URL generator script                                                               |
| **0.2.2-alpha**  | `.workflow-config.yaml` corrections, `copilot-instructions.md`                                                             |
| **0.3.0-alpha**  | ESLint, AbortController, `validateStatus`, branch coverage 90%+, deploy script, API review                                 |
| **0.3.6-alpha**  | Version sync, observer error isolation, broken doc cross-refs fixed, test quality hardening                                |
| **0.4.22-alpha** | Request/response interceptors, pluggable retry strategy, `DefaultCache<T>` generics, TypeScript ESLint coverage, 269 tests |
| **0.4.20-alpha** | Request/response interceptors, pluggable retry strategy, `DefaultCache<T>` generics, TypeScript ESLint coverage, 251 tests |

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
- [x] **Test suite refactoring** — extract repeated setup (cache factories, URL constants, mock
      observers) to shared helpers; convert parallel edge-case tests to `it.each` parameterised tables;
      rename any remaining implementation-focused test names to behaviour-focused names (e.g.
      "should store and retrieve null values" rather than "should handle null values"); prefer specific
      Jest matchers (`toBeUndefined`, `toBeNull`, `toHaveLength`, `toBeInstanceOf`, `toHaveBeenCalledTimes`,
      `toHaveBeenCalledWith`) over generic `toEqual`; use `.resolves`/`.rejects` for async assertions;
      ensure all mocks and timers are reset in `afterEach` for test isolation
- [x] **Integration & e2e test layer** — the current suite is unit-heavy (6 files, 1 directory);
      add integration tests covering cross-module flows (`IbiraAPIFetchManager` ↔ `DefaultCache` ↔
      `DefaultEventNotifier`) and at least one e2e scenario exercising the full fetch-cache-notify
      pipeline; maintain the test pyramid (unit → integration → e2e) as the codebase grows
- [x] **Version test consolidation** _(step_06)_ — `test/config/version.test.js` deleted (duplicate
      of `version.test.ts`; anti-pattern custom `toString` overrides removed); remaining work: move
      `test/config/version.test.ts` to `__tests__/` for consistent test location, and refactor
      prerelease-variation tests to `it.each` parameterised table with a `makeVersion(overrides)` helper
- [x] **`version.ts toString()` SemVer compliance** _(step_10)_ — when `prerelease` is empty,
      `toString()` correctly omits the trailing hyphen (verified: uses truthiness check, returns
      `"0.4.1"` not `"0.4.1-"`); no code change required — behaviour was already correct post
      TypeScript migration
- [x] **`sync-version.js` NaN guard** _(step_10)_ — after `core.split('.').map(Number)`, added
      `if (isNaN(major) || isNaN(minor) || isNaN(patch)) throw new Error(...)` so a malformed
      `package.json` version (e.g. `"x.y.z"`) produces a clear error instead of silently writing
      `NaN.NaN.NaN-alpha` to `version.ts`; main block wrapped in `try/catch` for clean stderr output
- [x] **Automated dependency management** _(step_09)_ — enable Dependabot or Renovate for automated
      PR-based dependency updates; add `npm audit` as a CI step; document in `CONTRIBUTING.md` that
      `package-lock.json` must be committed; pin critical tooling versions (`typescript`, `jest`,
      `ts-jest`) for reproducible builds across contributors
- [x] **Prettier integration** — add `.prettierrc` config file and ensure ESLint and Prettier configs
      do not conflict (install `eslint-config-prettier`); document formatting step in `CONTRIBUTING.md`
      (`npm run format` script and `prettier` devDependency already added in v0.4.x)
- [x] **Markdown quality hardening** — 2786 linting violations remain across 43 docs after bulk-fixing
      trailing spaces (MD009) and final newlines (MD047); manually review and fix nested list indentation
      (MD007) and headers ending with punctuation (MD026); integrate `markdownlint-cli` as a pre-commit
      hook (Husky) and CI step to prevent regressions; add `docs/MARKDOWN_LINTING_GUIDE.md` for
      contributors
- [x] **Cache cleanup scalability review** — profile the periodic cleanup interval
      (`_startPeriodicCleanup`) under high-load scenarios (many concurrent URLs, large TTL spreads);
      consider a lazy / on-demand eviction strategy for environments where `setInterval` is costly
- [x] **Edge-case documentation** — expand JSDoc and `docs/` to explicitly cover: cache overflow
      behaviour (what happens when `maxSize` is reached mid-burst), retry exhaustion (what the caller
      receives after all retries fail), and observer error isolation (does one subscriber's throw
      prevent others from being notified)
- [x] **`docs/INDEX.md` CDN & versioning refresh** — update CDN URLs and version references in
      `docs/INDEX.md` to point to npm-based delivery (`cdn.jsdelivr.net/npm/ibira.js@…/dist/index.mjs`)
      now that the package is published; verify all cross-links remain valid
- [x] **`docs/FUNCTIONAL_REQUIREMENTS.md` API alignment** — review and update to reflect current
      API surface (HTTP methods beyond GET, `validateStatus`, `AbortController` signal) and CDN usage
      patterns introduced in v0.4.x
- [x] **`docs/ARCHITECTURE.md` TypeScript update** — update to reflect TypeScript source migration,
      new `tsconfig.json` / tsup build pipeline, and the `dist/` output structure (CJS + ESM + `.d.ts`)
- [x] **`__tests__/README.md` dual-environment expansion** — expand to document dual-environment
      testing requirements (Node.js ≥18 + jsdom), new test modules (`DefaultCache`, `DefaultEventNotifier`),
      and the `npm run test:node` script
- [x] **Referential transparency docs cross-linking** — add explicit cross-links between the five
      related referential transparency documents (`docs/REFERENTIAL_TRANSPARENCY.md`,
      `.github/REFERENTIAL_TRANSPARENCY.md`, `docs/referential_transparency/REFERENTIAL_TRANSPARENCY.md`,
      `docs/referential_transparency/PURE_SOLUTION.md`,
      `docs/referential_transparency/VERIFICATION_REPORT.md`) so readers can navigate between them
- [x] **Script best-practice documentation** — add a brief "Script Best Practices" note to
      `docs/ARCHITECTURE.md` (or README.md) covering: executable permissions (`chmod +x`), shebang
      presence, required environment variables, and expected exit codes for `cdn-delivery.sh` and
      `scripts/deploy.sh`; also note each script's expected stdout output and return values

- [x] **Undocumented docs subdirectories** — 12 subdirectories under `docs/` and `.github/` lack a
      `README.md` or `index.md` explaining their purpose (`.github/ISSUE_TEMPLATE`,
      `.github/workflows`, `docs/architecture`, `docs/misc`, `docs/prompts`, `docs/reference`,
      `docs/referential_transparency`, `docs/reports`, `docs/reports/analysis`,
      `docs/reports/bugfixes`, `docs/testing`, `docs/workflow-automation`); add a minimal
      `README.md` to each so contributors understand what belongs where
- [x] **`@typescript-eslint` rule review** — `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` added; `eslint.config.mjs` now covers `src/**/*.ts` and `test/**/*.ts`; `no-explicit-any: 'error'` and `no-unused-vars` TypeScript variant are active
- [x] **`cdn-delivery.sh` helper functions** — extract ANSI color codes and repeated `echo`/log
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
- [x] **Result/Either pattern for fetch operations** — `Result<T, E>` discriminated union type added; `fetchSafe<T>()` method on `IbiraAPIFetcher` returns `Promise<Result<T>>` and never rejects; `Result` exported from `src/index.ts`; 8 new tests
- [x] **Runtime API response validation** — `parseResponse?: (data: unknown) => unknown` hook added to `FetcherOptions`; called after JSON parse, before caching; throwing propagates through the retry loop; compatible with any schema library (Zod, io-ts, Valibot); 6 new tests
- [x] **Import `ObserverSubject` pattern from `bessa_patterns.ts`** — `DefaultEventNotifier` now delegates to `DualObserverSubject` (v0.12.15-alpha) from the `bessa_patterns.ts` project via composition; bundled into the ibira.js dist (zero peer dependencies) via `noExternal` tsup config. CDN URL: `https://cdn.jsdelivr.net/gh/mpbarbosa/bessa_patterns.ts@v0.12.15-alpha/dist/index.mjs`

### Resilience patterns

Goal: add production-grade resilience to the request pipeline, closing the gap between ibira.js and battle-tested HTTP clients used in server-side applications.

#### Circuit breaker

A circuit breaker sits above the retry loop and prevents the library from hammering an unreachable
upstream. It tracks consecutive failures per URL, opens the circuit after a configurable threshold,
and probes with a single request after a timeout before closing again.

**Motivation:** the existing retry + exponential backoff strategy handles transient errors well, but
it still fires all retries against a fully-down endpoint. A circuit breaker short-circuits after N
consecutive failures, preserving resources and enabling immediate fallback to stale cache or a
secondary data source — without waiting for all retry attempts to exhaust.

**Design: standalone `CircuitBreakerManager` wrapper (preferred)**

The frozen, immutable `IbiraAPIFetcher` is not the right home for mutable circuit state.
`IbiraAPIFetchManager` already maintains per-URL fetcher instances, making it the natural anchor.
The cleanest implementation is a thin wrapper that satisfies the same `fetch(url, options)`
interface, keeps circuit state per URL in an internal `Map`, and delegates all actual fetching to
an inner `IbiraAPIFetchManager` instance. Zero changes to existing classes; fully composable.

```text
CircuitBreakerManager
  ├─> breakers: Map<url, CircuitBreaker>   // per-URL state machines
  └─> inner: IbiraAPIFetchManager          // existing fetch + cache + dedup layer
```

State machine (standard three-state model):

```text
CLOSED ──(N consecutive failures)──> OPEN
  ^                                    |
  |                                 (timeout)
  |                                    v
  └──(M consecutive successes)── HALF-OPEN
```

**Deliverables:**

- [x] **`CircuitBreaker` state machine** (`src/resilience/CircuitBreaker.ts`, ~150 lines) —
      pure class with no I/O; tracks `state: 'closed' | 'open' | 'half-open'`, `failureCount`,
      `successCount`, `nextRetryTime`; exposes `canAttempt(): boolean`, `recordSuccess(): void`,
      `recordFailure(error: Error): void`, `getState()`, `reset()`; configurable via
      `CircuitBreakerConfig`:
  - `failureThreshold: number` — consecutive failures before opening (default: `5`)
  - `successThreshold: number` — consecutive successes in half-open before closing (default: `2`)
  - `timeout: number` — milliseconds before transitioning open → half-open (default: `60000`)
  - `onStateChange?: (from: CircuitState, to: CircuitState, url: string) => void` — optional
    callback for monitoring / logging / metrics

- [x] **`CircuitBreakerManager` wrapper** (`src/resilience/CircuitBreakerManager.ts`, ~100 lines)
      — wraps `IbiraAPIFetchManager`; on each `fetch(url, options)` call:
  1. Looks up (or creates) the `CircuitBreaker` for that URL
  2. If `!breaker.canAttempt()`, calls the optional `fallback(url)` callback or throws
     `CircuitOpenError` (a typed subclass of `Error` carrying `url` and `retryAfter`)
  3. Delegates to inner `IbiraAPIFetchManager.fetch()`
  4. Calls `breaker.recordSuccess()` on resolution, `breaker.recordFailure(error)` on rejection
  5. Re-throws the original error after recording
  - Constructor accepts `inner: IbiraAPIFetchManager`, `config: CircuitBreakerConfig`, and an
    optional `fallback?: (url: string) => unknown` for stale-cache or secondary-source strategies

- [x] **Observer events for state transitions** — reuse `DefaultEventNotifier` to emit
      `'breaker-open'`, `'breaker-half-open'`, and `'breaker-closed'` events carrying
      `{ url, failureCount, retryAfter? }` payload; wired via the `onStateChange` callback

- [x] **`CircuitOpenError`** (`src/resilience/CircuitOpenError.ts`) — typed `Error` subclass;
      carries `url: string` and `retryAfter: number` (timestamp); lets consumers distinguish a
      breaker-blocked call from a network error at the type level

- [x] **Public exports** — re-export `CircuitBreaker`, `CircuitBreakerManager`, `CircuitOpenError`,
      `CircuitBreakerConfig` from `src/index.ts`; no changes to existing exports

- [ ] **Tests** (`__tests__/CircuitBreaker.test.ts`, ~200 lines; `__tests__/CircuitBreakerManager.test.ts`,
      ~150 lines) — cover:
  - All state transitions (closed → open → half-open → closed and closed → open → half-open → open)
  - Threshold counts: exact boundary (N-1 failures keep closed, N opens)
  - Half-open probe: one success advances to closed; one failure returns to open
  - `timeout` window with Jest fake timers
  - Per-URL isolation: failure on URL-A does not affect URL-B
  - `fallback` callback invoked when circuit is open
  - `CircuitOpenError` carries correct `url` and `retryAfter`
  - Observer events emitted on each state transition
  - Integration: `CircuitBreakerManager` + real `IbiraAPIFetchManager` with mocked `fetch`

- [ ] **`docs/CIRCUIT_BREAKER.md`** — usage guide with configuration reference, state diagram,
      a worked example showing `fallback` serving stale cache, and guidance on tuning thresholds for
      fast vs. slow external APIs

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

| ID     | Source step                        | Description                                                                                     | File/Path                                                                          | Priority | Status  |
| ------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- | ------- |
| RI-006 | workflow_20260325_172923 / step_07 | `__tests__/README.md` structure diagram missing `test/scripts/sync-version.test.js`             | `__tests__/README.md`                                                              | Low      | ✅ done |
| RI-007 | validate-logs audit                | MD026 trailing `?` in 39 FAQ.md section headers                                                 | `docs/FAQ.md`                                                                      | Low      | ✅ done |
| RI-008 | validate-logs audit                | MD031 missing blank lines around 26 fenced code blocks                                          | `docs/IBIRA_API_FETCHER.md`                                                        | Low      | ✅ done |
| RI-009 | workflow_20260325_222738 / step_13 | MD022/MD032 missing blank lines around headings/lists                                           | `CHANGELOG.md`                                                                     | Low      | ✅ done |
| RI-010 | workflow_20260325_222738 / step_13 | MD022/MD032/MD046/MD040 heading, indented code block, missing fence language                    | `docs/IBIRA_API_FETCHER.md`                                                        | Low      | ✅ done |
| RI-011 | workflow_20260325_222738 / step_13 | MD022/MD032 missing blank lines around Deploy Script Reference heading                          | `README.md`                                                                        | Low      | ✅ done |
| RI-012 | workflow_20260325_222738 / step_13 | MD001 heading level skips h3→h4 at line 363                                                     | `docs/referential_transparency/VERIFICATION_REPORT.md`                             | Low      | ✅ done |
| RI-013 | workflow_20260325_222738 / step_13 | MD001 heading level skips h3→h4 at line 210                                                     | `docs/reports/analysis/DOCUMENTATION_REPORT.md`                                    | Low      | ✅ done |
| RI-014 | workflow_20260326_141323 / step_13 | Broken relative link `../../docs/INDEX.md` → should be `../../INDEX.md`                         | `docs/reports/analysis/DOCUMENTATION_REPORT.md`                                    | Low      | ✅ done |
| RI-015 | workflow_20260326_141323 / step_08 | `scripts/colors.sh` undocumented — omitted from ARCHITECTURE.md Automation Scripts section      | `docs/ARCHITECTURE.md`                                                             | Low      | ✅ done |
| RI-016 | workflow_20260326_141323 / step_19 | `noUnusedLocals` and `noUnusedParameters` absent from tsconfig; dead private methods undetected | `tsconfig.json`, `src/core/IbiraAPIFetcher.ts`, `src/core/IbiraAPIFetchManager.ts` | Low      | ✅ done |
| RI-017 | workflow_20260326_141323 / step_09 | No `audit` script in package.json; vulnerability checks not discoverable                        | `package.json`                                                                     | Low      | ✅ done |
