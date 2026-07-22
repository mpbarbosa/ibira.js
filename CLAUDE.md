# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                  # Run all tests (jsdom environment)
npm run test:node         # Run tests against Node.js runtime
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report (≥75% required on all metrics)
npm run test:verbose      # Verbose output
npm run test:all          # version:check + validate + test

npx jest __tests__/IbiraAPIFetcher.test.js   # Run a single test file

npm run build             # Compile TypeScript → dist/ via tsup (CJS + ESM + .d.ts)
npm run validate          # tsc --noEmit type check only
npm run lint              # ESLint (src/, __tests__/, test/)
npm run version:sync      # Sync version across all files
npm run version:check     # Assert version consistency (required before publish)
```

Build output lives in `dist/`: `index.js` (CJS), `index.mjs` (ESM), `index.d.ts`. `bessa_patterns.ts` is bundled into the dist so the published package has zero peer dependencies.

## Architecture

ibira.js is an isomorphic JS/TS library (Node.js ≥18 + browser) with two public classes and a small set of utilities.

### Dual-layer design in `IbiraAPIFetcher`

The core class (`src/core/IbiraAPIFetcher.ts`) uses a deliberate **pure core / side-effects wrapper** split:

- **`fetchDataPure(cacheState, currentTime, networkProvider?, signal?)`** — the pure functional core. It takes the current cache as an immutable snapshot and returns a frozen `FetchResult` describing what _should_ happen (data, events list, cache operation list, new cache state). No mutations, no observer calls. Inject a `networkProvider` function to test without real HTTP.
- **`fetchData(cacheOverride?, signal?)`** — the practical wrapper. Calls `fetchDataPure`, then applies side effects via `_applySideEffects()`: mutates the cache and fires observer events. Also handles the retry loop with exponential backoff.

Instances are `Object.freeze`d on construction — all properties are readonly and immutable.

### Factory methods on `IbiraAPIFetcher`

Rather than using `new` directly, callers use static factories that configure cache and event notifier:

| Factory                               | Cache            | Events                 |
| ------------------------------------- | ---------------- | ---------------------- |
| `withDefaultCache(url, opts)`         | Internal LRU Map | `DefaultEventNotifier` |
| `withExternalCache(url, cache, opts)` | Caller-supplied  | `DefaultEventNotifier` |
| `withoutCache(url, opts)`             | No-op            | `DefaultEventNotifier` |
| `withEventCallback(url, fn, opts)`    | Internal LRU Map | Callback shim          |
| `withoutEvents(url, opts)`            | Internal LRU Map | No-op                  |
| `pure(url, opts)`                     | No-op            | No-op                  |

### `IbiraAPIFetchManager` (`src/core/IbiraAPIFetchManager.ts`)

Coordinates multiple fetchers sharing a single `globalCache`. Key behaviors:

- **Request deduplication**: concurrent calls to the same URL/method reuse the in-flight `Promise` (tracked in `pendingRequests`).
- **Periodic cleanup**: expired entries pruned via `setInterval`; call `manager.destroy()` to clear the timer.
- **Per-URL retry override**: `setRetryConfigForUrl()` replaces the frozen fetcher instance rather than mutating it.

Cache key format for both classes: `"METHOD:url"` (e.g. `"GET:https://api.example.com/data"`).

### Utilities (`src/utils/`)

- **`DefaultCache`** — Map-backed LRU cache implementing `CacheInterface`. Stores `CacheEntry<T>` (data + timestamp + expiresAt). Used internally; can also be injected via `withExternalCache`.
- **`DefaultEventNotifier`** — Wraps `DualObserverSubject` from `bessa_patterns.ts`. Fires `loading-start`, `success`, `error` events. Observer errors are isolated (one bad observer won't block others).
- **`debounce` / `throttle`** — standalone utility functions.

### Dependency: `bessa_patterns.ts`

The only runtime dependency is the npm package [`bessa_patterns.ts`](https://www.npmjs.com/package/bessa_patterns.ts) (`^0.13.0`). It provides `DualObserverSubject`, which is used exclusively inside `DefaultEventNotifier`. It is bundled into dist via `tsup`'s `noExternal` setting.

## Code conventions

- All new source is TypeScript in `src/`; tests in `__tests__/` are `.js` (with `ts-jest`/`babel-jest` transforms).
- No `any` in TypeScript (`@typescript-eslint/no-explicit-any: error`).
- Interfaces use duck-typing (`CacheInterface`, `EventNotifierInterface`) to allow custom implementations.
- `Object.freeze` is used on returned result objects and on fetcher instances — do not attempt to mutate them.
- Version is maintained in `src/config/version.ts` and must stay in sync with `package.json`; run `npm run version:sync` after bumping.
