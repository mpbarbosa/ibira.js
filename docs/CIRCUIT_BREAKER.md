# Circuit Breaker

ibira.js ships a three-state circuit breaker that wraps `IbiraAPIFetchManager`
to protect your application when a downstream API is degraded or unavailable.
This guide covers configuration, state machine behaviour, observer events, the
`fallback` pattern, and practical advice for tuning thresholds.

## Contents

- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Configuration reference](#configuration-reference)
- [State machine in detail](#state-machine-in-detail)
- [Observer events](#observer-events)
- [Fallback pattern: serving stale cache](#fallback-pattern-serving-stale-cache)
- [CircuitOpenError](#circuitopenerror)
- [Tuning thresholds](#tuning-thresholds)
- [API summary](#api-summary)

---

## How it works

```text
CLOSED ──(N consecutive failures)──> OPEN
  ^                                    |
  |                                (timeout ms)
  |                                    v
  └──(M consecutive successes)── HALF-OPEN
```

| State | Requests allowed? | Transitions to |
| --------- | ----------- | ------------------------------ |
| CLOSED | Yes — all requests pass | OPEN after N failures |
| OPEN | No — fast-fail or fallback | HALF-OPEN after `timeout` ms |
| HALF-OPEN | Yes — probe requests pass | CLOSED after M successes; OPEN after any failure |

The circuit starts in **CLOSED**. While closed it counts consecutive failures.
Once N failures accumulate the circuit **trips open** and starts a timer. No
requests are forwarded until the timer expires, at which point the circuit
enters **HALF-OPEN** and allows one or more probe requests through. If M
consecutive probes succeed the circuit **closes** and normal traffic resumes;
if any probe fails the circuit re-opens and the timer resets.

---

## Quick start

```ts
import { IbiraAPIFetchManager, CircuitBreakerManager } from 'ibira.js';

const inner = new IbiraAPIFetchManager({ maxCacheSize: 200 });

const manager = new CircuitBreakerManager(inner, {
  failureThreshold: 5,   // open after 5 consecutive failures
  successThreshold: 2,   // close after 2 consecutive successes in half-open
  timeout: 30_000,       // wait 30 s before probing
});

// Use exactly like IbiraAPIFetchManager
const data = await manager.fetch('https://api.example.com/users');
```

Clean up when your application shuts down:

```ts
manager.destroy(); // delegates to inner.destroy()
```

---

## Configuration reference

All fields are optional. Pass them as the second argument to
`CircuitBreakerManager` (or directly to `CircuitBreaker`).

| Option | Type | Default | Description |
| ------------------- | -------- | ------- | -------------------------------------------- |
| `failureThreshold` | `number` | `5` | Consecutive failures before the circuit opens |
| `successThreshold` | `number` | `2` | Consecutive successes in half-open before closing |
| `timeout` | `number` | `60000` | Milliseconds the circuit stays open before transitioning to half-open |
| `onStateChange` | function | `undefined` | Called on every state transition: `(from, to, url) => void` |

### `onStateChange` callback

```ts
const manager = new CircuitBreakerManager(inner, {
  onStateChange(from, to, url) {
    console.log(`[circuit] ${url}: ${from} → ${to}`);
  },
});
```

`onStateChange` is called **in addition to** the observer events fired by
`CircuitBreakerManager` (see [Observer events](#observer-events)). Use
`onStateChange` for lightweight logging; use observers when you need to
subscribe from outside the construction site.

---

## State machine in detail

### CLOSED → OPEN

`recordFailure()` increments `failureCount`. When `failureCount` reaches
`failureThreshold` the circuit transitions to OPEN:

- `nextRetryTime` is set to `Date.now() + timeout`
- `failureCount` remains at the threshold value (informational)
- Subsequent `canAttempt()` calls return `false` until `nextRetryTime` elapses

### OPEN → HALF-OPEN

`canAttempt()` checks `Date.now() >= nextRetryTime`. When the timeout has
elapsed it fires the transition automatically and returns `true`, allowing the
next request through as a probe.

### HALF-OPEN → CLOSED

Each successful response increments `successCount`. When `successCount` reaches
`successThreshold` the circuit closes:

- `failureCount` and `successCount` are reset to `0`
- `nextRetryTime` is reset to `0`

### HALF-OPEN → OPEN (probe failed)

Any failure in the half-open state immediately re-opens the circuit:

- `successCount` is reset to `0`
- `nextRetryTime` is set to `Date.now() + timeout` (timer resets)
- The cycle repeats

### reset()

`CircuitBreaker.reset()` forces the state machine to CLOSED with all counters
zeroed. It does **not** fire `onStateChange`. Use it for administrative
overrides (e.g. after a successful deployment or hotfix).

---

## Observer events

`CircuitBreakerManager` exposes a standard `subscribe` / `unsubscribe`
interface backed by `DefaultEventNotifier`.

```ts
manager.subscribe({
  update(event, payload) {
    // event: 'breaker-open' | 'breaker-half-open' | 'breaker-closed'
    // payload: BreakerEventPayload
    console.log(event, payload);
  },
});
```

### Event payloads

| Event | `url` | `failureCount` | `retryAfter` |
| --------------------- | ----- | -------------- | --------------------- |
| `'breaker-open'` | ✓ | count at trip | timestamp (ms epoch) |
| `'breaker-half-open'` | ✓ | count at trip | — |
| `'breaker-closed'` | ✓ | `0` (reset) | — |

```ts
manager.subscribe({
  update(event, payload) {
    if (event === 'breaker-open') {
      const wait = Math.ceil((payload.retryAfter - Date.now()) / 1000);
      metrics.increment('circuit_open', { url: payload.url });
      logger.warn(`Circuit open for ${payload.url}. Probe in ${wait}s.`);
    }
  },
});
```

Observer errors are isolated — a throwing observer does not prevent others
from receiving the event (same guarantee as `DefaultEventNotifier` throughout
the library).

---

## Fallback pattern: serving stale cache

When the circuit is open, the third constructor argument — an optional
`fallback` function — lets you serve cached or secondary data instead of
throwing `CircuitOpenError`.

```ts
import {
  IbiraAPIFetchManager,
  CircuitBreakerManager,
  DefaultCache,
} from 'ibira.js';

// A local stale-data store you populate on every successful response
const staleStore = new Map<string, unknown>();

const inner = new IbiraAPIFetchManager({ maxCacheSize: 200 });

const manager = new CircuitBreakerManager(
  inner,
  { failureThreshold: 3, timeout: 60_000 },
  // fallback receives the URL so you can look up per-URL stale data
  (url) => {
    const cached = staleStore.get(url);
    if (cached !== undefined) return cached;
    throw new Error(`No stale data for ${url}`);
  },
);

// Populate the stale store on success
manager.subscribe({
  update(event) {
    // Not needed here — the caller does this after each successful fetch
  },
});

async function fetchWithFallback(url: string) {
  const data = await manager.fetch(url);
  staleStore.set(url, data);   // keep stale store fresh
  return data;
}
```

When the circuit is open `manager.fetch()` calls `fallback(url)` synchronously.
If `fallback` throws, that error propagates to the caller — the `CircuitOpenError`
is **not** thrown in this case.

### Why not use `IbiraAPIFetchManager`'s built-in cache?

The inner manager's cache may have expired by the time the circuit trips. The
stale store above is intentionally kept alive indefinitely — it holds the
last-known-good response regardless of TTL. Whether that trade-off makes sense
depends on how stale your data can tolerate being.

---

## CircuitOpenError

When the circuit is open **and no fallback is configured**, `manager.fetch()`
throws `CircuitOpenError`:

```ts
import { CircuitBreakerManager, CircuitOpenError } from 'ibira.js';

try {
  const data = await manager.fetch(url);
} catch (err) {
  if (err instanceof CircuitOpenError) {
    const wait = Math.ceil((err.retryAfter - Date.now()) / 1000);
    console.warn(`Circuit open for ${err.url}. Try again in ${wait}s.`);
    return null;
  }
  throw err; // re-throw unexpected errors
}
```

| Property | Type | Description |
| ------------- | -------- | ------------------------------------------------- |
| `err.url` | `string` | The URL whose circuit is open |
| `err.retryAfter` | `number` | Timestamp (ms since epoch) when the probe window opens |
| `err.name` | `string` | `'CircuitOpenError'` |
| `err.message` | `string` | Human-readable summary including the ISO retry time |

`CircuitOpenError` extends `Error` with its prototype chain correctly restored,
so `instanceof` works reliably in transpiled environments.

---

## Tuning thresholds

There is no universal configuration — the right values depend on your API's
normal error rate, how quickly it recovers, and how much load it can absorb
during a probe window.

### Fast external APIs (< 500 ms p95 latency)

Failures are usually transient (network hiccup, brief restart). A tight
threshold means brief outages trip the circuit quickly; a short timeout means
probing resumes promptly.

```ts
{
  failureThreshold: 3,   // trip after 3 failures — noise filter
  successThreshold: 2,   // need 2 clean probes to trust recovery
  timeout: 10_000,       // probe after 10 s
}
```

### Slow or batch APIs (> 2 s p95 latency)

High latency naturally produces more transient failures. A looser threshold
avoids false trips; a longer timeout gives the API time to drain in-flight
work before probing.

```ts
{
  failureThreshold: 10,  // tolerate more noise
  successThreshold: 3,   // require 3 clean probes
  timeout: 120_000,      // probe after 2 min
}
```

### High-traffic services

When many callers share one `CircuitBreakerManager`, a single failing URL
trips quickly regardless of threshold — the failure count accumulates across
all concurrent requests. Consider:

- Raising `failureThreshold` to reduce false positives from burst errors.
- Using per-caller managers with independent thresholds for critical vs.
  non-critical endpoints.

### Using `onStateChange` for calibration

During development, log every transition to find the right balance:

```ts
{
  onStateChange(from, to, url) {
    console.log(`[circuit] ${from}→${to} ${url} at ${new Date().toISOString()}`);
  },
}
```

If the circuit opens frequently on a healthy API, raise `failureThreshold` or
inspect whether retries in `IbiraAPIFetchManager` are inflating the failure
count (each retry attempt that exhausts `maxRetries` counts as one failure from
the circuit breaker's perspective).

---

## API summary

### `CircuitBreaker`

```ts
new CircuitBreaker(url: string, config?: CircuitBreakerConfig)
```

| Method / getter | Description |
| ----------------------- | ----------------------------------------------- |
| `canAttempt()` | `true` if requests should be forwarded |
| `recordSuccess()` | Advances toward CLOSED |
| `recordFailure(error)` | Advances toward OPEN |
| `getState()` | Returns `'closed' \| 'open' \| 'half-open'` |
| `reset()` | Forces CLOSED, zeroes counters, no callback |
| `url` | The URL being guarded |
| `failureCount` | Current consecutive failure count |
| `successCount` | Current consecutive success count (half-open) |
| `nextRetryTime` | ms-epoch timestamp of next probe window; `0` when closed |

### `CircuitBreakerManager`

```ts
new CircuitBreakerManager(
  inner: IbiraAPIFetchManager,
  config?: CircuitBreakerConfig,
  fallback?: (url: string) => unknown,
)
```

| Method / getter | Description |
| ----------------------- | ----------------------------------------------- |
| `fetch(url, options?)` | Fetch through the circuit breaker |
| `getBreakerForUrl(url)` | Returns (or creates) the `CircuitBreaker` for a URL |
| `subscribe(observer)` | Subscribe to state-transition events |
| `unsubscribe(observer)` | Remove a subscriber |
| `subscriberCount` | Number of active subscribers |
| `destroy()` | Delegates to `inner.destroy()` |
