# Copilot Instructions for ibira.js

## Project Overview

ibira.js is a zero-dependency JavaScript library for API data fetching with built-in LRU caching and an observer pattern for reactive updates. All source is ES Modules.

## Commands

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:verbose        # Verbose output
npm run validate            # Validate JS syntax
npm run test:all            # validate + test

# Single test file or test case
npx jest __tests__/IbiraAPIFetcher.test.js
npx jest __tests__/IbiraAPIFetcher.test.js -t "should cache data"
npx jest --testNamePattern="Pure.*Referential"
```

No lint command is configured.

## Architecture

```text
src/
├── index.js                      # Public API barrel export
├── core/
│   ├── IbiraAPIFetcher.js        # Core fetcher — dual-layer design
│   └── IbiraAPIFetchManager.js   # Orchestrator for concurrent fetches
├── utils/
│   ├── DefaultCache.js           # Map-based LRU cache
│   └── DefaultEventNotifier.js   # Observer pattern implementation
└── config/
    └── version.js                # Semantic version object
```

**Dual-layer design in `IbiraAPIFetcher`:** The `fetchDataPure()` method is the pure functional core — it accepts external dependencies (cache, clock, network) and returns a plain result object with no side effects. `fetchData()` is the stateful wrapper that calls `fetchDataPure()` and commits side effects (updating instance state, notifying observers). New logic should follow this split.

**`IbiraAPIFetchManager`** deduplicates concurrent identical requests by tracking in-flight promises in a `pendingRequests` Map keyed by cache key.

## Key Conventions

### Immutability

Every class instance is frozen with `Object.freeze(this)` in the constructor. Nested arrays/objects are also frozen individually. Never mutate instance state directly — return new values instead.

### Factory methods over constructors

Prefer the static factory methods for instantiation:

```js
IbiraAPIFetcher.withDefaultCache(url)       // default LRU cache
IbiraAPIFetcher.withCustomCache(url, cache) // injected cache
IbiraAPIFetcher.pure(url)                   // no cache
```

### JSDoc is mandatory

Every class, method, and typedef must have full JSDoc including `@param` (with types), `@returns`, `@throws`, and `@example`. Use `@typedef` for complex parameter objects. Files include a `@fileoverview`, `@module`, `@license`, and `@copyright` header.

### Naming

- Classes: `PascalCase`
- Methods/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private methods: leading underscore (`_startPeriodicCleanup`)

### Code style

- Indentation: **tabs**
- Semicolons: yes
- No `var`; use `const`/`let`
- Arrow functions for callbacks and event handlers

### Test organization

- One test file per source module in `__tests__/`
- `describe` blocks group by behaviour (e.g., `"Constructor and Immutability"`)
- Test names start with `"should"`
- `beforeEach` resets mocks; `fetch` and `DefaultEventNotifier` are mocked at suite level
- Coverage thresholds: 75% on branches, functions, lines, and statements

### Error handling

- Retryable HTTP status codes: `408, 429, 500, 502, 503, 504`
- Retry uses exponential backoff: `retryDelay * retryMultiplier^retryCount`

## Testing environment

Jest 29 with `jest-environment-jsdom`. Babel (`@babel/preset-env` targeting current Node) transpiles ESM for Jest. There are **zero runtime dependencies**.
