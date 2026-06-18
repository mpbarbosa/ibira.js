# `__tests__` — Test Suite

This directory contains the Jest test suite for ibira.js.

> **Two test directories exist intentionally:**
>
> - `__tests__/` — JavaScript (`.js`) and TypeScript (`.ts`) tests for the main library; primary suite
> - `test/` — helper tests for repository scripts (`test/scripts/sync-version.test.js`)
>
> Both directories are discovered by the default `npm test` command.

## Structure

```text
__tests__/
├── IbiraAPIFetcher.test.js       # Unit: core fetcher — caching, retry, observers, pure API, AbortController, validateStatus
├── IbiraAPIFetchManager.test.js  # Unit: orchestrator — concurrency, deduplication, cache lifecycle, retry config, lazy cleanup
├── DefaultCache.test.js          # Unit: LRU cache — expiration, eviction, size limits, burst tie-breaking
├── DefaultEventNotifier.test.js  # Unit: observer pattern — subscribe/unsubscribe/notify, per-observer error isolation
├── debounce.test.js              # Unit: debounce utility
├── throttle.test.js              # Unit: throttle utility
├── index.test.js                 # Unit: public API barrel — export shape and re-export correctness
├── exports.test.js               # Unit: circular-export guard — verifies ibira.js barrel exports cleanly
├── integration.test.js           # Integration: real DefaultCache + real DefaultEventNotifier, only global.fetch mocked
├── e2e.test.js                   # E2E: full pipeline (fetch → cache → notify) with only global.fetch mocked
├── version.test.ts               # Unit: VERSION constant — semver format, toString(), sync with package.json
└── helpers.js                    # Shared test utilities (not a test file — excluded by testPathIgnorePatterns)

test/
└── scripts/
    └── sync-version.test.js      # Unit: sync-version.js script — parseVersion and generateVersionTs pure functions
```

## Running Tests

```bash
npm test                    # All suites — jsdom environment (default)
npm run test:node           # All suites — Node.js ≥18 environment (no DOM)
npm run test:coverage       # jsdom run with coverage report
npm run test:verbose        # jsdom run with individual test names printed
npm run test:watch          # Watch mode (jsdom)
npm run test:all            # version:check + validate + test (full pre-publish check)

# Single suite
npx jest __tests__/IbiraAPIFetcher.test.js

# Single test by name
npx jest -t "should cache data"
npx jest --testNamePattern="Pure.*Referential"
```

## Dual-Environment Requirements

ibira.js must pass **all tests in both environments** before any publish:

| Environment | Command               | Config file              | Purpose                                               |
| ----------- | --------------------- | ------------------------ | ----------------------------------------------------- |
| **jsdom**   | `npm test`            | `package.json → jest`    | Simulates browser globals (`fetch`, `URL`, `window`)  |
| **Node.js** | `npm run test:node`   | `jest.node.config.mjs`   | Verifies native Fetch API on Node.js ≥18 (no polyfill)|

Both environments run the **same test files** — no environment-specific test files.
The Node.js run confirms that no browser-only API has crept into library code.

Node.js ≥18 is required because it ships `fetch` natively. Running `test:node`
on an older Node.js version will fail with "fetch is not defined".

## Conventions

| Convention        | Rule                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| File naming       | `<SourceModule>.test.js` — mirrors `src/` structure                                                                                     |
| Suite grouping    | `describe` blocks group by behaviour (e.g. `"Constructor and Immutability"`)                                                            |
| Test naming       | Names start with `"should"`                                                                                                             |
| Unit mock pattern | `global.fetch` mocked via `jest.fn()`; `DefaultEventNotifier` replaced with a local `MockEventNotifier` class                          |
| Integration/E2E   | `global.fetch` is the **only** mock; real `DefaultCache` and real `DefaultEventNotifier` are used                                       |
| State reset       | `beforeEach` calls `jest.clearAllMocks()`; use `mockReset()` (not `clearAllMocks`) to clear `mockResolvedValueOnce` queues between tests |
| Timers            | `jest.useFakeTimers()` in `beforeEach`, `jest.useRealTimers()` in `afterEach`                                                           |

## Test Layer Responsibilities

| Layer           | File(s)                        | What is real              | What is mocked          |
| --------------- | ------------------------------ | ------------------------- | ----------------------- |
| **Unit**        | `*.test.js` (non-integration)  | Class under test          | All dependencies        |
| **Integration** | `integration.test.js`          | DefaultCache + EventNotifier + fetcher | `global.fetch` only |
| **E2E**         | `e2e.test.js`                  | Full pipeline end-to-end  | `global.fetch` only     |

## Coverage Targets

| Metric     | Threshold | Approximate current |
| ---------- | --------- | ------------------- |
| Statements | ≥ 75%     | ~98%                |
| Branches   | ≥ 75%     | ~90%                |
| Functions  | ≥ 75%     | ~91%                |
| Lines      | ≥ 75%     | ~99%                |

Coverage thresholds are enforced in `package.json → jest.coverageThreshold`. The build fails if any metric drops below 75%.

## Mocking Patterns

```js
// ── Unit tests: mock everything except the class under test ──────────────────

// Mock fetch globally
global.fetch = jest.fn();
global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => data });

// Once-variants go inside individual tests to avoid queue bleed between suites
global.fetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });

// Reset implementation queues (mockResolvedValueOnce) between tests
global.fetch.mockReset(); // use this, NOT jest.clearAllMocks()

// Inject a MockEventNotifier for observer unit tests
class MockEventNotifier {
  constructor() { this.events = []; }
  notify(...args) { this.events.push(args); }
  subscribe() {}
  unsubscribe() {}
  get subscriberCount() { return 0; }
}
const fetcher = IbiraAPIFetcher.withExternalCache(url, cache, {
  eventNotifier: new MockEventNotifier(),
});

// ── Integration / E2E tests: real classes, only fetch mocked ─────────────────

const manager = new IbiraAPIFetchManager(); // real DefaultCache + real DefaultEventNotifier
global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 1 }) });
const data = await manager.fetch(url); // exercises real cache + real event notifications

// ── Pure functional testing: no mocking needed ───────────────────────────────

const fetcher = IbiraAPIFetcher.pure(url);
const mockNetwork = () => Promise.resolve({ id: 1 });
const result = await fetcher.fetchDataPure(new Map(), Date.now(), mockNetwork);
// result.cacheOperations, result.events, result.newCacheState are all inspectable
```
