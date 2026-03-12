# __tests__ — Test Suite

This directory contains the full Jest test suite for ibira.js.

## Structure

```
__tests__/
├── IbiraAPIFetcher.test.js       # Core fetcher — caching, retry, observers, pure API, AbortController, validateStatus
├── IbiraAPIFetchManager.test.js  # Orchestrator — concurrency, deduplication, cache lifecycle, retry config
├── DefaultCache.test.js          # LRU cache — expiration, eviction, size limits
├── DefaultEventNotifier.test.js  # Observer pattern — subscribe/unsubscribe/notify lifecycle
└── index.test.js                 # Public API barrel — export validation
```

## Running Tests

```bash
npm test                    # Run all suites
npm run test:coverage       # Run with coverage report
npm run test:verbose        # Verbose output (test names)
npm run test:watch          # Watch mode

# Single suite
npx jest __tests__/IbiraAPIFetcher.test.js

# Single test by name
npx jest -t "should cache data"
npx jest --testNamePattern="Pure.*Referential"
```

## Conventions

| Convention | Rule |
|------------|------|
| File naming | `<SourceModule>.test.js` — mirrors `src/` structure |
| Suite grouping | `describe` blocks group by behaviour (e.g. `"Constructor and Immutability"`) |
| Test naming | Names start with `"should"` |
| Mocking | `global.fetch` is mocked via `jest.fn()` at suite level; `DefaultEventNotifier` is replaced with a local `MockEventNotifier` class |
| State reset | `beforeEach` clears all mocks with `jest.clearAllMocks()` |
| Timers | `jest.useFakeTimers()` in `beforeEach`, `jest.useRealTimers()` in `afterEach` |

## Coverage Targets

| Metric | Threshold | Current |
|--------|-----------|---------|
| Statements | ≥ 75% | ~98% |
| Branches | ≥ 75% | ~90% |
| Functions | ≥ 75% | ~91% |
| Lines | ≥ 75% | ~99% |

Coverage thresholds are enforced in `package.json → jest.coverageThreshold`. The build fails if any metric drops below 75%.

## Environment

Tests run in **jsdom** (configured in `package.json → jest.testEnvironment`). Babel (`@babel/preset-env` targeting current Node) transpiles ESM for Jest.

## Mocking Patterns

```js
// Mock fetch globally
global.fetch = jest.fn();
fetch.mockResolvedValue({ ok: true, status: 200, json: async () => data });

// Inject a MockEventNotifier for observer tests
const eventNotifier = new MockEventNotifier();
const fetcher = new IbiraAPIFetcher(url, cache, { eventNotifier });

// Pure functional testing (no mocking needed)
const mockNetwork = () => Promise.resolve({ id: 1 });
const result = await fetcher.fetchDataPure(new Map(), Date.now(), mockNetwork);
```
