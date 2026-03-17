# Getting Started with ibira.js

ibira.js is a zero-dependency JavaScript/TypeScript library for API data fetching with built-in LRU caching and an observer pattern for reactive updates.

## Installation

```bash
npm install ibira.js
```

## Requirements

- Node.js 18+ or a modern browser
- Zero runtime dependencies

## Quick Start

### Basic Fetch (with default LRU cache)

```js
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');
const result = await fetcher.fetchData();

if (result.success) {
  console.log(result.data);       // parsed JSON response
  console.log(result.fromCache);  // true on subsequent calls
}
```

### Fetch Without Cache

```js
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.pure('https://api.example.com/users');
const result = await fetcher.fetchData();
```

### Multiple Concurrent Fetches (with request deduplication)

```js
import { IbiraAPIFetchManager } from 'ibira.js';

const manager = new IbiraAPIFetchManager({
  maxCacheSize: 200,
  cacheExpiration: 10 * 60 * 1000, // 10 minutes
});

// Concurrent identical requests are automatically deduplicated —
// only one network call is made, all callers receive the same result.
const [users, posts] = await Promise.all([
  manager.fetch('https://api.example.com/users'),
  manager.fetch('https://api.example.com/posts'),
]);
```

## Key Concepts

### Factory Methods

Prefer the static factory methods over `new IbiraAPIFetcher()`:

| Method | Description |
|--------|-------------|
| `IbiraAPIFetcher.withDefaultCache(url, options?)` | Creates fetcher with a built-in LRU cache |
| `IbiraAPIFetcher.withCustomCache(url, cache, options?)` | Creates fetcher with your own cache object |
| `IbiraAPIFetcher.pure(url, options?)` | Creates fetcher with no caching |

### Caching

By default, responses are cached for **5 minutes** with a **100-entry LRU** eviction policy.

```js
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data', {
  maxCacheSize: 50,
  cacheExpiration: 2 * 60 * 1000, // 2 minutes
});
```

### Retry Logic

Requests are retried automatically on these HTTP status codes: `408`, `429`, `500`, `502`, `503`, `504`.

Retries use exponential backoff: `retryDelay × retryMultiplier^attempt`.

```js
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data', {
  maxRetries: 5,
  retryDelay: 500,        // start at 500ms
  retryMultiplier: 2,     // 500 → 1000 → 2000 → 4000 → 8000ms
});
```

### Observer Pattern (Reactive Updates)

Subscribe to fetch lifecycle events using the `DefaultEventNotifier`:

```js
import { IbiraAPIFetcher, DefaultEventNotifier } from 'ibira.js';

const notifier = new DefaultEventNotifier();

notifier.subscribe({
  update: (event, payload) => {
    if (event === 'loading-start') console.log('Fetching…');
    if (event === 'success')       console.log('Done:', payload);
    if (event === 'error')         console.error('Failed:', payload);
  },
});

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data', {
  eventNotifier: notifier,
});

await fetcher.fetchData();
```

### POST / Non-GET Requests

```js
const fetcher = IbiraAPIFetcher.pure('https://api.example.com/users', {
  method: 'POST',
  body: { name: 'Alice', email: 'alice@example.com' },
  // Content-Type: application/json is added automatically for plain objects
});

const result = await fetcher.fetchData();
```

## Next Steps

- [API Reference](./API.md) — full class and method documentation
- [Examples](./EXAMPLES.md) — more usage patterns
- [Architecture](./ARCHITECTURE.md) — how the library is structured internally
- [Troubleshooting](./TROUBLESHOOTING.md) — common issues and fixes
