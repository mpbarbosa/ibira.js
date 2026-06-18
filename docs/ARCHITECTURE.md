# Architecture Overview - IbiraAPIFetcher

## System Design

The IbiraAPIFetcher employs a **dual-layer architecture** that separates pure functional computation from side effects, achieving perfect referential transparency while maintaining practical usability.

```text
┌─────────────────────────────────────────────────────────────┐
│                    IbiraAPIFetcher                          │
├─────────────────────────────────────────────────────────────┤
│  🔵 Pure Functional Core (Referentially Transparent)       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  fetchDataPure(cacheState, time, networkProvider)  │   │
│  │  • Zero side effects                               │   │
│  │  • Deterministic behavior                          │   │
│  │  • Immutable returns (Object.freeze)               │   │
│  │  • Returns operation descriptions                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  🟡 Side Effects Layer (Practical Wrapper)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  fetchData(cacheOverride)                          │   │
│  │  • Uses pure core for computation                  │   │
│  │  • Applies side effects via _applySideEffects     │   │
│  │  • Maintains backward compatibility                │   │
│  │  • Handles mutations and notifications             │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  🔧 Dependencies (Injected)                                │
│  • Cache (Map with metadata)                               │
│  • EventNotifier (Observer pattern)                        │
│  • NetworkProvider (for testing)                           │
└─────────────────────────────────────────────────────────────┘
```

## Source Layout and Build Pipeline

### Source tree (`src/`)

```text
src/
├── index.ts                    ← public re-exports (the package entry point)
├── core/
│   ├── IbiraAPIFetcher.ts      ← dual-layer fetcher (pure core + side-effects wrapper)
│   └── IbiraAPIFetchManager.ts ← multi-fetcher coordinator
├── utils/
│   ├── DefaultCache.ts         ← Map-backed LRU cache
│   ├── DefaultEventNotifier.ts ← observer pattern wrapper around DualObserverSubject
│   ├── debounce.ts             ← standalone utility
│   └── throttle.ts             ← standalone utility
└── config/
    └── version.ts              ← canonical version constant (synced with package.json)
```

### TypeScript configuration (`tsconfig.json`)

| Option                  | Value          | Why                                                   |
| ----------------------- | -------------- | ----------------------------------------------------- |
| `target`                | `ES2022`       | Modern output; no down-levelling overhead             |
| `lib`                   | `ES2022, DOM`  | Gives access to `fetch`, `AbortController`, `Map`     |
| `module`                | `ESNext`       | Native ES modules                                     |
| `moduleResolution`      | `bundler`      | Correct resolution for tsup; allows extensionless imports |
| `strict`                | `true`         | Full strict mode (no `any` enforced by ESLint too)    |
| `noUnusedLocals/Params` | `true`         | Prevents dead-code accumulation in source             |

`tsc --noEmit` is used for type-checking only (`npm run validate`). Actual compilation is done by **tsup**.

### Build pipeline (tsup)

```text
src/index.ts  ──tsup──►  dist/index.js      (CommonJS)
                      ►  dist/index.mjs     (ESM)
                      ►  dist/index.d.ts    (TypeScript declarations)
                      ►  dist/index.js.map  (source maps)
                      ►  dist/index.mjs.map (source maps)
```

Key tsup settings (`tsup.config.ts`):

- `entry: ['src/index.ts']` — single entry, all exports via `src/index.ts`
- `format: ['cjs', 'esm']` — dual output
- `dts: true` — generates `.d.ts` declarations alongside JS
- `noExternal: ['bessa_patterns.ts']` — bundles the only runtime dependency so the published package has **zero peer dependencies**
- `target: 'es2022'` — matches `tsconfig.json`; no additional down-levelling

### `dist/` output structure

```text
dist/
├── index.js       ← CJS  (require('ibira.js'))
├── index.mjs      ← ESM  (import from 'ibira.js')
├── index.d.ts     ← TypeScript declarations (automatic with moduleResolution: bundler)
├── index.js.map
└── index.mjs.map
```

`package.json` exports map ensures the correct format is served by bundler/Node.js:

```json
"main":    "dist/index.js",
"module":  "dist/index.mjs",
"types":   "dist/index.d.ts",
"exports": { ".": { "import": "./dist/index.mjs", "require": "./dist/index.js" } }
```

---

## Component Breakdown

### 1. Pure Functional Core

**Purpose**: Mathematical computation without side effects

**Key Methods**:

- `fetchDataPure()` - Main pure computation
- `_getExpiredCacheKeys()` - Pure cache analysis
- `_applyCacheSizeLimitsPure()` - Pure cache sizing
- `_calculateCacheEvictions()` - Pure eviction calculation

**Characteristics**:

- No mutations of external state
- All results frozen for immutability
- Dependency injection for all external resources
- Returns operation descriptions instead of executing them

### 2. Side Effects Layer

**Purpose**: Apply computed operations to real world

**Key Methods**:

- `fetchData()` - Practical wrapper
- `_applySideEffects()` - Execute operations from pure core
- `notifyObservers()` - Event notification wrapper

**Operations Applied**:

- Cache mutations (set, update, delete)
- Event notifications (loading-start, success, error)
- Network requests (via fetch API)

### 3. Dependency Management

**Injected Dependencies**:

```typescript
import {
  IbiraAPIFetcher,
  DefaultCache,
  DefaultEventNotifier,
} from 'ibira.js';

// Provide your own cache
const cache = new DefaultCache<MyData>({ maxSize: 100, expiration: 300_000 });

// Provide your own event notifier
const notifier = new DefaultEventNotifier();

// Inject via factory
const fetcher = IbiraAPIFetcher.withExternalCache(url, cache, {
  eventNotifier: notifier,
});
```

## Data Flow

### Pure Computation Flow

```text
Input Parameters → fetchDataPure() → Immutable Result Object
     ↓                  ↓                      ↓
[cacheState]     [zero mutations]      [operation descriptions]
[currentTime]    [no side effects]     [new cache state]
[networkProvider] [deterministic]      [event descriptions]
```

### Side Effects Application Flow

```text
Pure Result → _applySideEffects() → Real World Changes
     ↓               ↓                      ↓
[cacheOperations] [apply to cache]    [cache updated]
[events]         [notify observers]   [events fired]
[error/success]  [throw/return]       [caller receives]
```

## Static Factory Patterns

Factory methods provide different configurations for various use cases:

```javascript
// For shared caching scenarios
IbiraAPIFetcher.withExternalCache(url, sharedCache);

// For standard usage with reasonable defaults
IbiraAPIFetcher.withDefaultCache(url, { maxSize: 100 });

// For testing or simple scenarios
IbiraAPIFetcher.withoutCache(url);

// For functional programming patterns
IbiraAPIFetcher.pure(url);

// For event-driven architectures
IbiraAPIFetcher.withEventCallback(url, eventHandler);
```

## Performance Characteristics

### Memory Management

- **LRU Cache Eviction**: Oldest entries removed when size limits exceeded
- **Expired Entry Cleanup**: Automatic removal of stale cache entries
- **Immutable Objects**: Safe to cache and reuse without mutation concerns
- **Object Pooling**: Frozen objects can be safely shared across calls

### Computational Efficiency

- **Deterministic Caching**: Pure function results can be memoized
- **Parallel Safe**: No shared mutable state enables concurrent execution
- **Minimal Allocations**: Reuses cache state objects when possible
- **Lazy Evaluation**: Network requests only when cache misses occur

## Error Handling Strategy

### Pure Core Error Handling

```javascript
// Errors returned as data (no exceptions in pure core)
return {
	success: false,
	error: new Error('HTTP error! status: 404'),
	// ... other properties
};
```

### Wrapper Error Handling

```javascript
// Traditional exception throwing for backward compatibility
if (!result.success) {
	throw result.error;
}
return result.data;
```

## Testing Strategy

### Environments

Tests run in two environments (both required to pass before publish):

| Command              | Environment | Purpose                                              |
| -------------------- | ----------- | ---------------------------------------------------- |
| `npm test`           | jsdom       | Default; simulates browser globals (`fetch`, `URL`)  |
| `npm run test:node`  | Node.js     | Verifies Node.js ≥18 native Fetch API compatibility  |

### Test modules

| File                                    | What it covers                                              |
| --------------------------------------- | ----------------------------------------------------------- |
| `__tests__/IbiraAPIFetcher.test.js`     | Unit: pure core + side-effects wrapper                      |
| `__tests__/IbiraAPIFetchManager.test.js`| Unit: deduplication, cleanup, manager lifecycle             |
| `__tests__/DefaultCache.test.js`        | Unit: LRU eviction, expiration, size limits                 |
| `__tests__/DefaultEventNotifier.test.js`| Unit: subscribe/unsubscribe, error isolation                |
| `__tests__/integration.test.js`         | Integration: real DefaultCache + real DefaultEventNotifier  |
| `__tests__/e2e.test.js`                 | E2E: full pipeline (fetch → cache → notify) with mocked network |

### Pure Function Testing

- **No mocking required** for core logic
- **Deterministic inputs/outputs** enable reliable assertions
- **Isolated testing** of computation vs side effects
- Inject `networkProvider` to test without real HTTP calls

### Integration Testing

- Mock only `global.fetch`; use real DefaultCache + real DefaultEventNotifier
- **Side effects verification** through spy functions
- **End-to-end workflows** with real integrations

## Migration Path

### From Impure (v0.0.x) to Pure (v0.1.0+)

**Old Usage**:

```javascript
const fetcher = new IbiraAPIFetcher(url);
fetcher.data; // Mutable state
fetcher.loading; // Mutable state
await fetcher.fetchData(); // Side effects mixed with logic
```

**New Usage (Backward Compatible)**:

```javascript
const fetcher = IbiraAPIFetcher.withDefaultCache(url);
// No exposed mutable state
const data = await fetcher.fetchData(); // Clean separation
```

**New Usage (Pure Functional)**:

```javascript
const fetcher = IbiraAPIFetcher.pure(url);
const result = await fetcher.fetchDataPure(cacheState, Date.now());
// Handle result.cacheOperations and result.events as needed
```

## Extensibility

### Custom Cache Implementations

```javascript
class RedisCache {
	async get(key) {
		/* Redis get */
	}
	async set(key, value) {
		/* Redis set */
	}
	// ... implement Map-like interface
}

const fetcher = IbiraAPIFetcher.withExternalCache(url, new RedisCache());
```

### Custom Event Handlers

```javascript
const customEventHandler = (event, data) => {
	switch (event) {
		case 'loading-start':
			showSpinner();
			break;
		case 'success':
			hideSpinner();
			break;
		case 'error':
			showError(data.error);
			break;
	}
};

const fetcher = IbiraAPIFetcher.withEventCallback(url, customEventHandler);
```

---

## Automation Scripts

Three shell scripts handle CDN URL generation, release deployment, and shared terminal formatting.

### `cdn-delivery.sh`

Generates jsDelivr CDN URLs for the current version and writes them to `cdn-urls.txt`.

```bash
./cdn-delivery.sh
# Output: CDN URLs printed to terminal + cdn-urls.txt updated
```

### `scripts/deploy.sh`

Tags a release, pushes to remote, and regenerates CDN URLs. Runs tests automatically before tagging — deploy is aborted on failure.

**Prerequisites:** clean working tree, writable `origin` remote, Node.js/npm available.

```bash
# Deploy current package.json version
./scripts/deploy.sh

# Deploy a specific version
./scripts/deploy.sh 0.3.0-alpha
```

**Exit codes:** `0` success · `1` dirty tree · `2` tests failed · `3` tag exists · `4` push failed

### `scripts/colors.sh`

Provides shared ANSI color constants (`RED`, `GREEN`, `YELLOW`, `BLUE`, `NC`) for use by other shell scripts. Source it instead of duplicating color escape codes:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
echo -e "${GREEN}OK${NC}"
```

Not intended to be executed directly.

---

_Architecture designed for referential transparency, testability, and maintainability_
_ibira.js v0.4.31-alpha — TypeScript source, tsup build pipeline_
