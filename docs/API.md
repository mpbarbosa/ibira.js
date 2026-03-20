# ibira.js API Reference

**Version:** 0.4.3-alpha  
**License:** MIT

---

## Table of Contents

- [IbiraAPIFetcher](#ibiraaapifetcher)
- [IbiraAPIFetchManager](#ibiraaapifetchmanager)
- [DefaultCache](#defaultcache)
- [DefaultEventNotifier](#defaulteventnotifier)
- [throttle](#throttle)
- [debounce](#debounce)
- [VERSION](#version)
- [Types & Interfaces](#types--interfaces)

---

## IbiraAPIFetcher

Core fetcher class with dual-layer design: a pure functional core (`fetchDataPure`) and a stateful wrapper (`fetchData`) that commits side effects.

### Factory Methods

#### `IbiraAPIFetcher.withDefaultCache(url, options?)`

Creates a fetcher with a built-in LRU cache.

```ts
IbiraAPIFetcher.withDefaultCache(url: string, options?: FetcherOptions): IbiraAPIFetcher
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | The endpoint URL to fetch |
| `options` | `FetcherOptions` | Optional configuration (see [FetcherOptions](#fetcheroptions)) |

```js
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
```

#### `IbiraAPIFetcher.withCustomCache(url, cache, options?)`

Creates a fetcher with an injected cache object.

```ts
IbiraAPIFetcher.withCustomCache(url: string, cache: CacheInterface, options?: FetcherOptions): IbiraAPIFetcher
```

```js
const myCache = new DefaultCache({ maxSize: 500 });
const fetcher = IbiraAPIFetcher.withCustomCache('https://api.example.com/data', myCache);
```

#### `IbiraAPIFetcher.pure(url, options?)`

Creates a fetcher with no caching.

```ts
IbiraAPIFetcher.pure(url: string, options?: FetcherOptions): IbiraAPIFetcher
```

### Instance Methods

#### `fetcher.fetchData()`

Fetches data, applies cache, retries on failure, and notifies observers.

```ts
fetchData(): Promise<FetchResult>
```

Returns a [`FetchResult`](#fetchresult) object.

```js
const result = await fetcher.fetchData();
if (result.success) {
  console.log(result.data);
  console.log(result.fromCache); // true if served from cache
}
```

#### `fetcher.fetchDataPure(cache, clock, network)`

Pure functional core — no side effects. Accepts external dependencies and returns a plain result object. Use for testing or custom orchestration.

```ts
fetchDataPure(
  cache: Map<string, CacheEntry>,
  clock: () => number,
  network: (url: string, init: RequestInit) => Promise<Response>
): Promise<FetchResult>
```

---

## IbiraAPIFetchManager

Manages multiple concurrent API fetch operations with shared caching and request deduplication.

### Constructor

```ts
new IbiraAPIFetchManager(options?: ManagerOptions)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxCacheSize` | `number` | `100` | Maximum number of cache entries |
| `cacheExpiration` | `number` | `300000` | Cache TTL in milliseconds |
| `cleanupInterval` | `number` | `60000` | Periodic cleanup interval in milliseconds |
| `maxRetries` | `number` | `3` | Default max retry attempts |
| `retryDelay` | `number` | `1000` | Initial retry delay in milliseconds |
| `retryMultiplier` | `number` | `2` | Exponential backoff multiplier |
| `retryableStatusCodes` | `number[]` | `[408,429,500,502,503,504]` | Status codes that trigger retries |

### Methods

#### `manager.fetch(url, options?)`

Fetches a URL with deduplication — concurrent identical requests share one network call.

```ts
fetch(url: string, options?: FetcherOptions): Promise<unknown>
```

```js
const data = await manager.fetch('https://api.example.com/users');
```

#### `manager.fetchAll(urls, options?)`

Fetches multiple URLs concurrently.

```ts
fetchAll(urls: string[], options?: FetcherOptions): Promise<unknown[]>
```

```js
const [users, posts] = await manager.fetchAll([
  'https://api.example.com/users',
  'https://api.example.com/posts',
]);
```

#### `manager.subscribe(observer)`

Subscribes an observer to all fetch events across all managed fetchers.

```ts
subscribe(observer: Observer): void
```

#### `manager.unsubscribe(observer)`

Removes a previously subscribed observer.

```ts
unsubscribe(observer: Observer): void
```

#### `manager.getStats()`

Returns current statistics about the manager state.

```ts
getStats(): ManagerStats
```

#### `manager.destroy()`

Stops periodic cleanup and releases all resources.

```ts
destroy(): void
```

---

## DefaultCache

Map-based LRU cache with TTL expiration.

### Constructor

```ts
new DefaultCache(options?: CacheOptions)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxSize` | `number` | `50` | Maximum number of entries |
| `expiration` | `number` | `300000` | Entry TTL in milliseconds |

### Methods

Implements the full `Map`-like interface: `has`, `get`, `set`, `delete`, `clear`, `entries`, `size`.

```js
const cache = new DefaultCache({ maxSize: 100, expiration: 60000 });
cache.set('key', { data: 'value', timestamp: Date.now(), expiresAt: Date.now() + 60000 });
const entry = cache.get('key');
```

---

## DefaultEventNotifier

Observer pattern implementation for fetch lifecycle events.

### Constructor

```ts
new DefaultEventNotifier()
```

### Methods

#### `notifier.subscribe(observer)`

```ts
subscribe(observer: Observer): void
```

#### `notifier.unsubscribe(observer)`

```ts
unsubscribe(observer: Observer): void
```

#### `notifier.notify(event, payload)`

```ts
notify(event: string, payload: unknown): void
```

#### `notifier.clear()`

Removes all subscribers.

```ts
clear(): void
```

#### `notifier.subscriberCount` *(readonly)*

```ts
readonly subscriberCount: number
```

---

## throttle

Limits a function to execute at most once per interval.

```ts
throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): T
```

```js
import { throttle } from 'ibira.js';

const throttledFetch = throttle(() => manager.fetch(url), 1000);
window.addEventListener('scroll', throttledFetch);
```

---

## debounce

Delays function execution until after a quiet period.

```ts
debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T
```

```js
import { debounce } from 'ibira.js';

const debouncedSearch = debounce((query) => manager.fetch(`/search?q=${query}`), 300);
input.addEventListener('input', (e) => debouncedSearch(e.target.value));
```

---

## VERSION

Semantic version object for the library.

```ts
const VERSION: { major: number; minor: number; patch: number; prerelease: string; toString(): string }
```

```js
import { VERSION } from 'ibira.js';
console.log(VERSION.toString()); // "0.4.3-alpha"
```

---

## Types & Interfaces

### FetcherOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `timeout` | `number` | `10000` | Request timeout in milliseconds |
| `eventNotifier` | `EventNotifierInterface` | — | Observer for fetch events |
| `maxRetries` | `number` | `3` | Max retry attempts |
| `retryDelay` | `number` | `1000` | Initial retry delay (ms) |
| `retryMultiplier` | `number` | `2` | Exponential backoff multiplier |
| `retryableStatusCodes` | `number[]` | `[408,429,500,502,503,504]` | Status codes triggering retries |
| `maxCacheSize` | `number` | `100` | Max cache entries |
| `cacheExpiration` | `number` | `300000` | Cache TTL in milliseconds |
| `cache` | `CacheInterface` | — | Custom cache object |
| `validateStatus` | `(status: number) => boolean` | `status >= 200 && status < 300` | Custom success validator |
| `method` | `HttpMethod` | `'GET'` | HTTP method |
| `body` | `object \| string \| FormData \| Blob \| null` | `null` | Request body |
| `headers` | `Record<string, string>` | `{}` | Additional headers |

### FetchResult

| Property | Type | Description |
|----------|------|-------------|
| `success` | `boolean` | Whether the operation succeeded |
| `data` | `unknown` | Fetched data (when `success` is `true`) |
| `error` | `Error` | Error that occurred (when `success` is `false`) |
| `fromCache` | `boolean` | Whether data was served from cache |
| `cacheOperations` | `readonly CacheOperation[]` | Cache operations performed |
| `events` | `readonly FetchEvent[]` | Events that fired during the operation |
| `newCacheState` | `Map<string, CacheEntry>` | Full cache state after the operation |
| `meta` | `FetchMeta` | Request metadata (key, timestamp, attempt, etc.) |

### Observer

```ts
interface Observer {
  update: (...args: unknown[]) => void;
}
```

### HttpMethod

```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
```
