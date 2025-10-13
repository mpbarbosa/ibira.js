# Architecture Overview - IbiraAPIFetcher

## System Design

The IbiraAPIFetcher employs a **dual-layer architecture** that separates pure functional computation from side effects, achieving perfect referential transparency while maintaining practical usability.

```
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
```javascript
// Cache dependency
const cache = new Map();
cache.maxSize = 100;
cache.expiration = 300000;

// Event notifier dependency  
const eventNotifier = new DefaultEventNotifier();

// Create instance with dependencies
const fetcher = new IbiraAPIFetcher(url, cache, { eventNotifier });
```

## Data Flow

### Pure Computation Flow
```
Input Parameters → fetchDataPure() → Immutable Result Object
     ↓                  ↓                      ↓
[cacheState]     [zero mutations]      [operation descriptions]
[currentTime]    [no side effects]     [new cache state]
[networkProvider] [deterministic]      [event descriptions]
```

### Side Effects Application Flow
```
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
IbiraAPIFetcher.withExternalCache(url, sharedCache)

// For standard usage with reasonable defaults
IbiraAPIFetcher.withDefaultCache(url, {maxSize: 100})

// For testing or simple scenarios
IbiraAPIFetcher.withoutCache(url)

// For functional programming patterns
IbiraAPIFetcher.pure(url)

// For event-driven architectures
IbiraAPIFetcher.withEventCallback(url, eventHandler)
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

### Pure Function Testing
- **No mocking required** for core logic
- **Deterministic inputs/outputs** enable reliable assertions
- **Isolated testing** of computation vs side effects
- **Property-based testing** possible due to purity

### Integration Testing
- **Mock dependencies** (cache, eventNotifier, networkProvider)
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
    async get(key) { /* Redis get */ }
    async set(key, value) { /* Redis set */ }
    // ... implement Map-like interface
}

const fetcher = IbiraAPIFetcher.withExternalCache(url, new RedisCache());
```

### Custom Event Handlers
```javascript
const customEventHandler = (event, data) => {
    switch(event) {
        case 'loading-start': showSpinner(); break;
        case 'success': hideSpinner(); break;
        case 'error': showError(data.error); break;
    }
};

const fetcher = IbiraAPIFetcher.withEventCallback(url, customEventHandler);
```

---

*Architecture designed for referential transparency, testability, and maintainability*  
*IbiraAPIFetcher v0.1.0-alpha*