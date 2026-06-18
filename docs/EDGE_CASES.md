# Edge Cases

This document covers three behaviours that are correct but non-obvious.
Each section explains what happens, why it happens that way, and how to
work with it in practice.

## 1. Cache overflow (maxSize reached mid-burst)

### What happens

`DefaultCache` and `IbiraAPIFetchManager`'s shared `globalCache` both enforce a
hard upper bound (`maxSize`). The limit is enforced **synchronously on every
write** — the cache never holds more than `maxSize` entries at the end of any
`set()` call.

When an entry is written that would exceed `maxSize`, the entry with the
**lowest `timestamp`** (least recently used) is evicted immediately before
`set()` returns.

```text
maxSize: 2

set('a', ts=100) → [a]           size: 1
set('b', ts=200) → [a, b]        size: 2
set('c', ts=300) → evict 'a' (ts=100) → [b, c]   size: 2
```

### Mid-burst behaviour

During a high-concurrency burst where many entries land with the same
`timestamp` (e.g. all set in the same millisecond), the eviction picks the
first-inserted entry among those with equal timestamps. Insertion order in
JavaScript's `Map` is stable, so the result is deterministic.

### Practical guidance

- Choose `maxSize` to fit your working set. The default is 50 for
  `DefaultCache` and 100 for `IbiraAPIFetchManager`.
- If burst eviction is a concern, raise `maxSize` or lower `cacheExpiration`
  so stale entries expire before the limit is hit.
- Monitor with `manager.getStats()` — `cacheUtilization` shows current
  pressure; `expiredEntries` shows how many have already passed TTL but
  haven't been cleaned yet.

```typescript
const manager = new IbiraAPIFetchManager({ maxCacheSize: 500 });
const stats = manager.getStats();
console.log(`${stats.cacheSize}/${stats.maxCacheSize} (${stats.cacheUtilization}%)`);
```

---

## 2. Retry exhaustion

### What happens

`IbiraAPIFetcher.fetchData()` retries automatically on retryable errors (HTTP
408, 429, 500–504 by default). The total number of attempts is
`maxRetries + 1` (1 initial attempt plus up to `maxRetries` retries).

When the **final attempt** also fails, the **original error from that attempt**
is re-thrown directly — it is never wrapped in another `Error`. You receive
exactly the same error type and message as if there had been no retries at all.

```text
maxRetries: 3  →  4 total attempts: attempt 0, 1, 2, 3
                                               ↑
                                   error thrown from here
```

### Retryable vs non-retryable errors

| Situation | Retried? |
| --------- | -------- |
| HTTP 408, 429, 500, 502, 503, 504 | Yes (default) |
| Custom `retryableStatusCodes` match | Yes |
| Custom `retryStrategy` returns `true` | Yes |
| Network error (`TypeError: Failed to fetch`) | Yes |
| HTTP 4xx not in `retryableStatusCodes` | No — thrown immediately |
| `signal.aborted` (AbortController) | No — thrown immediately |

### Disabling retries

Set `maxRetries: 0` to disable retries entirely. The first failure throws
immediately.

```typescript
const fetcher = IbiraAPIFetcher.withDefaultCache(url, { maxRetries: 0 });
try {
  await fetcher.fetchData();
} catch (error) {
  console.error('Failed (no retries):', error.message);
}
```

### Catching exhausted retries

```typescript
const fetcher = IbiraAPIFetcher.withDefaultCache(url); // maxRetries: 3

try {
  const data = await fetcher.fetchData();
  // success — data is the parsed JSON response
} catch (error) {
  if (error instanceof TypeError) {
    // Network-level failure (DNS, CORS, offline)
    console.error('Network error after 4 attempts:', error.message);
  } else {
    // HTTP error string, e.g. 'HTTP error! status: 503'
    console.error('HTTP error after 4 attempts:', error.message);
  }
}
```

### Exponential backoff delays

Between attempts, ibira.js sleeps for `retryDelay * retryMultiplier ^ attempt` ms.
With defaults (`retryDelay: 1000`, `retryMultiplier: 2`):

| Attempt | Delay before this attempt |
| ------- | ------------------------- |
| 0       | 0 ms (immediate)          |
| 1       | 1 000 ms                  |
| 2       | 2 000 ms                  |
| 3       | 4 000 ms                  |

Total worst-case wait before the error is thrown: ~7 seconds with defaults.

---

## 3. Observer error isolation

### What happens

When one of the observers subscribed to a `DefaultEventNotifier` throws inside
its `update()` method, the error is **caught and silently discarded**. All
other subscribed observers still receive the notification in subscription order.

The notifier itself never throws, never logs, and never accumulates thrown
errors. Isolation is handled by the underlying
[`DualObserverSubject`](https://github.com/mpbarbosa/bessa_patterns.ts) from
`bessa_patterns.ts`.

```text
observers: [A, B (throws), C]

notify('success', data)
  → A.update('success', data)   ✓
  → B.update('success', data)   ✗ throws — error discarded
  → C.update('success', data)   ✓ still called
```

### Practical guidance

**Do not rely on observer errors propagating.** If an observer has an
error-handling requirement, handle it inside `update()` itself:

```typescript
fetcher.subscribe({
  update(event, payload) {
    try {
      processEvent(event, payload);
    } catch (err) {
      reportError(err); // handle it here — do not let it escape
    }
  },
});
```

**Event delivery is guaranteed in subscription order**, so if ordering matters
(e.g. a logging observer must run before a UI observer), subscribe in that order.

**The `error` event is separate from observer errors.** The `error` event is
emitted by the fetcher when a request fails — it is a normal notification like
`loading-start` and `success`. An observer throwing inside its own `update()`
is a bug in the observer's code, not a fetch error.

```typescript
fetcher.subscribe({
  update(event, payload) {
    if (event === 'error') {
      // This is a fetch error reported by the fetcher — handle it
      console.error('Fetch failed:', payload.error);
    }
    // Do NOT throw here — it would be swallowed and other observers unaffected
  },
});
```
