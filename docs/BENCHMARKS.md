# Performance Benchmarks

This document records the in-process throughput of ibira.js's core
subsystems. All benchmarks are pure computation — network latency is
excluded by design.

## Contents

- [Methodology](#methodology)
- [Results](#results)
  - [DefaultCache](#1-defaultcache)
  - [CircuitBreaker](#2-circuitbreaker)
  - [fetchDataPure — cache-hit path](#3-ibiraapifetcherfetchdatapure--cache-hit-path)
  - [throttle / debounce](#4-throttle--debounce)
- [Observations](#observations)
- [Reproducing](#reproducing)

---

## Methodology

- **Script**: `scripts/benchmark.mjs`
- **Each benchmark**: 100 000 iterations (10 000 for async) preceded by
  10 000 warm-up iterations to let V8 JIT-compile the hot path before
  measurement begins
- **Timer**: `performance.now()` (sub-millisecond resolution)
- **What is measured**: in-process CPU work only — Map lookups, object
  allocations, state-machine logic, Promise micro-task overhead
- **What is excluded**: network I/O, DNS, TLS, JSON serialisation of
  HTTP responses

### Environment

| | |
| ---- | ----- |
| **Node.js** | v26.3.0 |
| **Platform** | linux x64 |
| **Run date** | 2026-06-18 |

---

## Results

### 1. DefaultCache

| Operation | ops/s | ns/op |
| ----------------------------------------- | ----------------: | ----: |
| `set()` — sequential keys, no eviction | 4 315 292 | 232 |
| `get()` — warm hit, 900-entry cache | 16 755 159 | 60 |
| `has()` — hit | 21 114 192 | 47 |
| `has()` — miss | 12 062 653 | 83 |
| `set()` — LRU eviction active (maxSize=100) | 100 331 | 9 967 |

### 2. CircuitBreaker

| Operation | ops/s | ns/op |
| ----------------------------------------------- | ----------------: | ----: |
| `canAttempt()` — closed state | 119 326 901 | 8 |
| `canAttempt()` — open, timeout not elapsed | 10 154 755 | 99 |
| `recordFailure()` + `reset()` — open/close cycle | 203 377 | 4 917 |

### 3. IbiraAPIFetcher.fetchDataPure — cache-hit path

| Operation | ops/s | µs/op |
| --------------------------------- | -------: | ----: |
| `fetchDataPure()` — warm cache hit | 493 007 | 2.03 |

### 4. throttle / debounce

| Operation | ops/s | ns/op |
| -------------------------------------- | ----------------: | -----: |
| `throttle()` factory creation | 12 720 394 | 79 |
| throttled fn call (mixed traffic) | 9 432 505 | 106 |
| `debounce()` factory creation | 5 518 868 | 181 |
| debounced fn call (accumulation) | 915 626 | 1 092 |

---

## Observations

### DefaultCache

**`get()` and `has()` are fast** (47–83 ns). They resolve to a single
`Map.get()` or `Map.has()` call plus a timestamp comparison — negligible
compared to any real network call.

**`set()` without eviction is fast** (232 ns). It performs a `Map.set()`
plus bookkeeping.

**`set()` with LRU eviction is 43× slower** (~10 µs). When the cache
is full, eviction scans all entries to find the oldest timestamp. For
workloads that hit the `maxSize` limit on every write, consider:

- Raising `maxSize` to fit the working set.
- Lowering `cacheExpiration` so entries expire before the limit is hit.
- Providing a `DefaultCache` instance with a generous `maxSize` via
  `IbiraAPIFetcher.withExternalCache()`.

### CircuitBreaker

**`canAttempt()` in the closed state costs 8 ns** — effectively free.
The hot path is a single property read (`this._state === 'closed'`).

**`canAttempt()` in the open state costs ~100 ns** because it calls
`Date.now()` to compare against `nextRetryTime`. This is still
negligible: even at 10 000 failed requests per second, the breaker
check is less than 1 ms of total CPU time.

**`recordFailure()` + `reset()` cycles at ~5 µs** because both methods
fire the `onStateChange` callback (in this benchmark that slot is
empty, but real usage adds callback overhead).

### fetchDataPure — cache-hit path

The pure functional core resolves in **~2 µs** on a cache hit. This
covers: the cache key build, `Map.get()`, expiry check, `FetchResult`
assembly, and returning a frozen object. No network, no observer side
effects.

In practice, `fetchData()` adds observer calls and cache mutations
on top of this, but those are dominated by network round-trip time
(typically 1–100+ ms) in any real application.

### throttle / debounce

**Wrapper creation is cheap** (79–181 ns). Both factories are safe to
call inside a render loop or tight event handler without concern.

**Debounced call accumulation (~1 µs)** is higher than throttle because
debounce manages a shared `Promise` and a cancellable timer. For
CPU-bound hot paths where 1 µs matters, prefer a plain callback
approach over debounce.

---

## Reproducing

```bash
npm run build          # compile TypeScript → dist/
node scripts/benchmark.mjs
```

The benchmark script reads from the built `dist/index.mjs` so it
measures the same code that consumers install. Re-run after any change
to `src/` to detect regressions.

To add a new benchmark, append a `bench()` or `benchAsync()` call to
`scripts/benchmark.mjs`. Both helpers print results to stdout in the
same tabular format.
