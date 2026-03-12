# ibira.js Roadmap

> **Current version:** 0.3.1-alpha — Alpha Hardening  
> **Status:** Beta preparation in progress

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
| **0.3.1-alpha** | Version sync, observer error isolation, broken doc cross-refs fixed, test quality hardening |

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

- [ ] **Share `.vscode/settings.json`** — unignore via `.gitignore` exception (`!.vscode/settings.json`)
  so contributors automatically get the project's cSpell word list and any future editor settings;
  add `.vscode/extensions.json` recommending ESLint and cSpell extensions
- [ ] **`.ai_workflow/` README** — add `.ai_workflow/README.md` documenting the purpose of the
  AI workflow automation directory and explaining that its contents are tooling artifacts (not
  library code) so contributors know to leave it alone
- [ ] **Version consistency automation** — add a pre-commit hook or `npm run version:check` script
  that asserts `package.json`, `src/config/version.js`, and `.workflow-config.yaml` all agree on
  the current version, preventing silent drift like the `0.2.2-alpha` / `0.3.0-alpha` mismatch
- [ ] **Test suite refactoring** — extract repeated setup (cache factories, URL constants, mock
  observers) to shared helpers; convert parallel edge-case tests to `it.each` parameterised tables;
  rename any remaining implementation-focused test names to behaviour-focused names (e.g.
  "should store and retrieve null values" rather than "should handle null values")
- [ ] **Prettier integration** — add `prettier` dev dependency with a `.prettierrc` config file and
  a `"format": "prettier --write ."` script; ensure ESLint and Prettier configs do not conflict
  (install `eslint-config-prettier`); document formatting step in `CONTRIBUTING.md`
- [ ] **Cache cleanup scalability review** — profile the periodic cleanup interval
  (`_startPeriodicCleanup`) under high-load scenarios (many concurrent URLs, large TTL spreads);
  consider a lazy / on-demand eviction strategy for environments where `setInterval` is costly
- [ ] **Edge-case documentation** — expand JSDoc and `docs/` to explicitly cover: cache overflow
  behaviour (what happens when `maxSize` is reached mid-burst), retry exhaustion (what the caller
  receives after all retries fail), and observer error isolation (does one subscriber's throw
  prevent others from being notified)

---

## 🔜 v0.4.x — Beta Preparation

Goal: make ibira.js usable beyond CDN delivery, including as an npm dependency for TypeScript projects.

### Market context

Existing public packages (`p-retry` ~32M DLs/week, `ky` ~2M DLs/week) cover retry and HTTP
individually — both are TypeScript-native. ibira.js's genuine differentiator is the **combination**
of LRU cache + retry + observer pattern in a single, isomorphic package. No public package covers
all three. Prioritising TypeScript migration and Node.js support makes that niche viable.

### Items

- [ ] **TypeScript source migration** — convert `IbiraAPIFetcher.js`, `DefaultCache.js`,
  `DefaultEventNotifier.js` to `.ts`; add `tsconfig.json` targeting `ES2022` with
  `"lib": ["ES2022", "DOM"]`, `strict: true`, `declaration: true`; replace Babel with `ts-jest`;
  ship generated `.d.ts` files in `dist/`. Native interfaces replace JSDoc `@typedef`:
  `FetcherOptions`, `FetchResult<T>`, `CacheEntry`, `Observer`
- [ ] **Node.js ≥ 18 dual support** — ibira.js source already uses zero browser APIs
  (`window`, `document`, CORS `mode:` absent; pure `fetch` + `Map` + observer); formalise
  Node.js support by adding `"engines": { "node": ">=18" }` and a second jest config:
  `jest.browser.config.js` (`testEnvironment: jsdom`) and `jest.node.config.js`
  (`testEnvironment: node`); all 152 tests expected to pass unmodified in both environments
- [ ] **npm publication** — register package on npmjs.com; add GitHub Actions publish workflow
  triggered on version tags; update install instructions
- [ ] **CJS + ESM dual build** — emit both `dist/index.cjs` and `dist/index.mjs` for maximum
  compatibility; add `exports` field to `package.json` with `"."` and `"./cache"` sub-paths
- [ ] **HTTP methods beyond GET** — `POST`, `PUT`, `PATCH`, `DELETE` support with configurable
  body serialization

---

## 🔜 v0.5.x — Middleware & Extension Points

Goal: let consumers customise the request/response pipeline.

- [ ] **Request interceptors** — hook into the request before it is sent (custom headers, auth tokens, signing)
- [ ] **Response interceptors** — transform or validate responses before caching
- [ ] **Pluggable cache backends** — formalise the cache interface so consumers can swap in localStorage, IndexedDB, Redis adapters, etc.
- [ ] **Pluggable retry strategies** — expose a `retryStrategy(attempt, error)` function option alongside the existing fixed exponential backoff

---

## 🎯 v1.0.0 — Stable Release

Goal: production-ready, semantically stable public API.

- [ ] All `v0.x` features finalised and documented
- [ ] Full TypeScript strict-mode compatibility
- [ ] 95%+ test coverage across all metrics
- [ ] Performance benchmarks published in `docs/`
- [ ] `MIGRATION.md` updated for any breaking changes from alpha
- [ ] `SECURITY.md` and responsible-disclosure process
- [ ] Automated npm publish via GitHub Actions on tagged releases

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
