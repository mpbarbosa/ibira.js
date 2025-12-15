# Node.js API Pattern Documentation for ibira.js

**Document Version:** 1.0.0  
**Date:** December 15, 2025  
**Project:** ibira.js v0.2.0-alpha  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Directory Structure](#directory-structure)
4. [Module Organization](#module-organization)
5. [Design Patterns](#design-patterns)
6. [API Documentation](#api-documentation)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Contributing Guidelines](#contributing-guidelines)
10. [Testing Strategy](#testing-strategy)

---

## 1. Introduction

### What is the Node.js API Pattern?

The Node.js API pattern is a structural approach to organizing code that emphasizes:

- **Modularity**: Breaking down functionality into focused, single-responsibility modules
- **Clear Separation of Concerns**: Organizing code by function (core logic, utilities, configuration)
- **Maintainability**: Making code easier to understand, test, and modify
- **Scalability**: Providing a structure that grows naturally with the project

### Why This Pattern for ibira.js?

ibira.js was refactored from a monolithic 1,261-line file into a modular structure because:

1. **Improved Maintainability**: Smaller files (200-700 lines) are easier to understand
2. **Better Testing**: Isolated modules can be tested independently
3. **Enhanced Collaboration**: Multiple developers can work on different modules
4. **Clearer Dependencies**: Explicit imports make dependencies transparent
5. **Better IDE Support**: Improved autocomplete and navigation

---

## 2. Architecture Overview

### High-Level Architecture

```text
┌─────────────────────────────────────────┐
│         Public API (index.js)           │
│  Single entry point for all exports     │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼─────┐      ┌──────▼──────┐
│  Core   │      │   Utils     │
│ Classes │      │  & Helpers  │
└───┬─────┘      └──────┬──────┘
    │                   │
    └─────────┬─────────┘
              │
        ┌─────▼─────┐
        │   Config  │
        │ Constants │
        └───────────┘
```

### Layered Architecture

1. **Entry Layer** (`index.js`): Public API surface
2. **Core Layer** (`core/`): Business logic and main classes
3. **Utility Layer** (`utils/`): Reusable helpers and supporting classes
4. **Configuration Layer** (`config/`): Constants and configuration

### Dependency Flow

```text
Entry (index.js)
  ↓ imports
Core (IbiraAPIFetcher, IbiraAPIFetchManager)
  ↓ imports
Utils (DefaultCache, DefaultEventNotifier)
  ↓ imports
Config (version)
```

**Rule**: Lower layers never import from higher layers (prevents circular dependencies)

---

## 3. Directory Structure

### Complete Structure

```text
ibira.js/
├── src/                          # Source code
│   ├── index.js                  # Main entry point (72 lines)
│   │
│   ├── core/                     # Core business logic
│   │   ├── IbiraAPIFetcher.js    # Main fetcher class (700+ lines)
│   │   └── IbiraAPIFetchManager.js # Manager coordination (480+ lines)
│   │
│   ├── utils/                    # Utility classes
│   │   ├── DefaultCache.js       # Cache implementation (60 lines)
│   │   └── DefaultEventNotifier.js # Observer pattern (50 lines)
│   │
│   ├── config/                   # Configuration
│   │   └── version.js            # Version constants (20 lines)
│   │
│   └── README.md                 # Source code documentation
│
├── __tests__/                    # Test suite
│   └── IbiraAPIFetcher.test.js   # Unit tests
│
├── docs/                         # Documentation
│   ├── NODE_API_PATTERN.md       # This document
│   ├── ARCHITECTURE.md           # Architecture details
│   └── referential_transparency/ # FP documentation
│
├── package.json                  # NPM configuration
├── babel.config.mjs              # Babel configuration
├── README.md                     # Project README
└── MIGRATION.md                  # Migration guide
```

### Purpose of Each Directory

| Directory | Purpose | File Types | Examples |
|-----------|---------|------------|----------|
| `src/` | All source code | `.js` modules | Core classes, utilities |
| `src/core/` | Business logic | Class files | `IbiraAPIFetcher.js` |
| `src/utils/` | Reusable helpers | Utility classes | `DefaultCache.js` |
| `src/config/` | Configuration | Constants, config | `version.js` |
| `__tests__/` | Test files | `.test.js` | Unit, integration tests |
| `docs/` | Documentation | `.md` files | Architecture, guides |

---

## 4. Module Organization

### 4.1 Entry Point (`src/index.js`)

**Purpose**: Single source of truth for public API

```javascript
// ibira.js - Main entry point
// Exports all public APIs

export { IbiraAPIFetcher } from './core/IbiraAPIFetcher.js';
export { IbiraAPIFetchManager } from './core/IbiraAPIFetchManager.js';
export { DefaultCache } from './utils/DefaultCache.js';
export { DefaultEventNotifier } from './utils/DefaultEventNotifier.js';
export { VERSION } from './config/version.js';
```

**Design Principles**:

- ✅ Single entry point for all imports
- ✅ Re-exports from internal modules
- ✅ Clear, named exports (no default exports)
- ✅ Minimal logic (just re-exports)

**Usage**:

```javascript
// Users import from the package
import { IbiraAPIFetcher, VERSION } from 'ibira.js';
```

---

### 4.2 Core Module (`src/core/`)

**Purpose**: Contains the main business logic and domain models

#### IbiraAPIFetcher.js

**Responsibilities**:

- Fetching data from APIs
- Managing cache lifecycle
- Implementing retry logic
- Observer pattern notifications
- Pure functional operations

**Key Features**:

```javascript
// Static factory methods for different use cases
IbiraAPIFetcher.withDefaultCache(url, options)
IbiraAPIFetcher.withExternalCache(url, cache, options)
IbiraAPIFetcher.withoutCache(url, options)
IbiraAPIFetcher.pure(url, options)

// Pure functional core
await fetcher.fetchDataPure(cacheState, timestamp, networkProvider)

// Practical wrapper with side effects
await fetcher.fetchData()
```

**Class Structure**:

```text
IbiraAPIFetcher
├── Static Factory Methods
│   ├── withDefaultCache()
│   ├── withExternalCache()
│   ├── withoutCache()
│   ├── withEventCallback()
│   ├── withoutEvents()
│   └── pure()
│
├── Constructor
│   └── Frozen for immutability
│
├── Cache Operations (Private)
│   ├── _createCacheEntry()
│   ├── _isCacheEntryValid()
│   ├── _enforceCacheSizeLimit()
│   ├── _getExpiredCacheKeys()
│   └── _cleanupExpiredCache()
│
├── Network Operations (Private)
│   ├── _performSingleRequest()
│   ├── _isRetryableError()
│   ├── _calculateRetryDelay()
│   └── _sleep()
│
├── Pure Operations
│   ├── fetchDataPure()
│   ├── _applyCacheSizeLimitsPure()
│   └── _calculateCacheEvictions()
│
├── Side Effect Operations
│   ├── fetchData()
│   └── _applySideEffects()
│
└── Observer Pattern
    ├── subscribe()
    ├── unsubscribe()
    └── notifyObservers()
```

#### IbiraAPIFetchManager.js

**Responsibilities**:

- Managing multiple fetcher instances
- Preventing duplicate concurrent requests
- Coordinating shared cache
- Periodic cleanup
- Statistics and monitoring

**Key Features**:

```javascript
const manager = new IbiraAPIFetchManager(options);

// Get or create fetchers
const fetcher = manager.getFetcher(url, options);

// Fetch with deduplication
const data = await manager.fetch(url, options);

// Batch operations
const results = await manager.fetchMultiple(urls, options);

// Cache management
manager.clearCache(url);
manager.triggerCleanup();

// Monitoring
const stats = manager.getStats();
```

**Class Structure**:

```text
IbiraAPIFetchManager
├── Constructor
│   └── Starts periodic cleanup timer
│
├── Fetcher Management
│   ├── getFetcher()
│   └── _executeFetch()
│
├── Fetch Operations
│   ├── fetch()
│   └── fetchMultiple()
│
├── Cache Management
│   ├── getCachedData()
│   ├── clearCache()
│   ├── _createCacheEntry()
│   ├── _isCacheEntryValid()
│   ├── _getExpiredCacheKeys()
│   ├── _enforceCacheSizeLimit()
│   └── _performPeriodicCleanup()
│
├── Cleanup Operations
│   ├── _startPeriodicCleanup()
│   ├── triggerCleanup()
│   └── destroy()
│
├── Configuration
│   ├── setCacheExpiration()
│   ├── setMaxCacheSize()
│   ├── setRetryConfig()
│   └── setRetryConfigForUrl()
│
├── Monitoring
│   ├── isLoading()
│   ├── getStats()
│   └── getRetryConfig()
│
└── Observer Pattern
    ├── subscribe()
    └── unsubscribe()
```

---

### 4.3 Utils Module (`src/utils/`)

**Purpose**: Reusable utility classes and helper functions

#### DefaultCache.js

**Responsibilities**:

- Map-based caching
- LRU (Least Recently Used) eviction
- Size limit enforcement

```javascript
export class DefaultCache {
  constructor(options = {})
  has(key)
  get(key)
  set(key, value)
  delete(key)
  clear()
  get size()
  entries()
  _enforceSizeLimit()  // Private
}
```

**Features**:

- Configurable max size (default: 50 entries)
- Configurable expiration (default: 5 minutes)
- Automatic LRU eviction when full
- Map-like interface for compatibility

**Usage**:

```javascript
import { DefaultCache } from 'ibira.js';

const cache = new DefaultCache({ 
  maxSize: 100, 
  expiration: 600000  // 10 minutes
});

cache.set('key', { data: 'value', timestamp: Date.now() });
const entry = cache.get('key');
```

#### DefaultEventNotifier.js

**Responsibilities**:

- Observer pattern implementation
- Event subscription management
- Notification broadcasting

```javascript
export class DefaultEventNotifier {
  constructor()
  subscribe(observer)
  unsubscribe(observer)
  notify(...args)
  clear()
  get subscriberCount()
}
```

**Features**:

- Immutable observer updates
- Safe notification (checks for `update` method)
- Multiple observer support
- Thread-safe operations

**Usage**:

```javascript
import { DefaultEventNotifier } from 'ibira.js';

const notifier = new DefaultEventNotifier();

const observer = {
  update(event, data) {
    console.log(`Event: ${event}`, data);
  }
};

notifier.subscribe(observer);
notifier.notify('data-received', { payload: 'test' });
```

---

### 4.4 Config Module (`src/config/`)

**Purpose**: Configuration constants and version information

#### version.js

**Responsibilities**:

- Semantic version information
- Version string formatting

```javascript
export const VERSION = {
  major: 0,
  minor: 2,
  patch: 0,
  prerelease: "alpha",
  toString: function() {
    return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
  }
};
```

**Usage**:

```javascript
import { VERSION } from 'ibira.js';

console.log(`ibira.js v${VERSION.toString()}`);
// Output: ibira.js v0.2.0-alpha

console.log(`Major version: ${VERSION.major}`);
// Output: Major version: 0
```

---

## 5. Design Patterns

### 5.1 Dependency Injection

**Pattern**: Dependencies are injected rather than created internally

**Example from IbiraAPIFetcher**:

```javascript
// Cache is injected, not created
constructor(url, cache, options = {}) {
  this.cache = cache;  // Injected dependency
  this.eventNotifier = options.eventNotifier || new DefaultEventNotifier();
}

// Usage
const customCache = new Map();
const fetcher = new IbiraAPIFetcher(url, customCache, options);
```

**Benefits**:

- Easier testing (inject mocks)
- Better flexibility (swap implementations)
- Clearer dependencies

---

### 5.2 Factory Pattern

**Pattern**: Static factory methods for object creation

**Example from IbiraAPIFetcher**:

```javascript
// Different factory methods for different use cases
static withDefaultCache(url, options = {}) {
  const cache = this._createDefaultCache(options);
  return new IbiraAPIFetcher(url, cache, options);
}

static withoutCache(url, options = {}) {
  const noCache = { /* null object pattern */ };
  return new IbiraAPIFetcher(url, noCache, options);
}

static pure(url, options = {}) {
  // Creates a pure functional instance
}
```

**Benefits**:

- Clear intent (method name describes behavior)
- Hides complex construction logic
- Provides multiple creation pathways

---

### 5.3 Observer Pattern

**Pattern**: Objects subscribe to events and get notified of changes

**Implementation**:

```javascript
// DefaultEventNotifier implements observer pattern
class DefaultEventNotifier {
  subscribe(observer) {
    this.observers = [...this.observers, observer];
  }
  
  notify(...args) {
    this.observers.forEach(observer => {
      observer.update(...args);
    });
  }
}

// Usage in IbiraAPIFetcher
this.notifyObservers('loading-start', { url: this.url });
this.notifyObservers('success', data);
this.notifyObservers('error', { error });
```

**Benefits**:

- Decouples event source from listeners
- Supports multiple subscribers
- Flexible event handling

---

### 5.4 Strategy Pattern

**Pattern**: Different algorithms/strategies can be swapped

**Example with cache strategies**:

```javascript
// Different cache strategies
const memoryCache = new DefaultCache();
const noCache = { has: () => false, get: () => null, ... };
const customCache = new RedisCache();

// Same interface, different implementations
const fetcher1 = new IbiraAPIFetcher(url, memoryCache);
const fetcher2 = new IbiraAPIFetcher(url, noCache);
const fetcher3 = new IbiraAPIFetcher(url, customCache);
```

**Benefits**:

- Easy to swap implementations
- Follows Open/Closed principle
- Testable with mocks

---

### 5.5 Pure Functional Core, Imperative Shell

**Pattern**: Pure core logic wrapped with side effects

**Architecture**:

```javascript
// Pure core - no side effects
async fetchDataPure(cacheState, currentTime, networkProvider) {
  // Returns description of what should happen
  return {
    success: true,
    data: {...},
    cacheOperations: [...],
    events: [...],
    newCacheState: new Map(...)
  };
}

// Imperative shell - applies side effects
async fetchData() {
  const result = await this.fetchDataPure(this.cache);
  this._applySideEffects(result, this.cache);
  
  if (result.success) return result.data;
  else throw result.error;
}
```

**Benefits**:

- Pure core is easy to test
- Side effects are isolated
- Referentially transparent
- Deterministic behavior

---

### 5.6 Module Pattern

**Pattern**: Encapsulation through ES6 modules

**Structure**:

```javascript
// Private implementation details
class PrivateHelper {
  // Internal use only
}

// Public API
export class PublicAPI {
  // Exposed to users
}

// Only PublicAPI is accessible from outside
```

**Benefits**:

- True encapsulation
- Clear public API surface
- Prevents accidental coupling

---

## 6. API Documentation

### 6.1 Core API

#### IbiraAPIFetcher

**Constructor**:

```javascript
new IbiraAPIFetcher(url, cache, options)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | API endpoint URL |
| `cache` | `Object` | Cache instance (Map-like interface) |
| `options` | `Object` | Configuration options |
| `options.timeout` | `number` | Request timeout (default: 10000ms) |
| `options.maxRetries` | `number` | Max retry attempts (default: 3) |
| `options.retryDelay` | `number` | Initial retry delay (default: 1000ms) |
| `options.retryMultiplier` | `number` | Backoff multiplier (default: 2) |
| `options.retryableStatusCodes` | `number[]` | Retryable HTTP codes |
| `options.eventNotifier` | `Object` | Custom event notifier |

**Static Factory Methods**:

```javascript
// Create with default cache
IbiraAPIFetcher.withDefaultCache(url, options)

// Create with external cache
IbiraAPIFetcher.withExternalCache(url, cache, options)

// Create without cache
IbiraAPIFetcher.withoutCache(url, options)

// Create with event callback
IbiraAPIFetcher.withEventCallback(url, callback, options)

// Create without events
IbiraAPIFetcher.withoutEvents(url, options)

// Create pure functional instance
IbiraAPIFetcher.pure(url, options)
```

**Instance Methods**:

```javascript
// Fetch data (with side effects)
await fetcher.fetchData(cacheOverride)

// Pure fetch (no side effects)
await fetcher.fetchDataPure(cacheState, currentTime, networkProvider)

// Observer pattern
fetcher.subscribe(observer)
fetcher.unsubscribe(observer)
fetcher.notifyObservers(event, data)

// Cache management
const key = fetcher.getCacheKey()
```

---

#### IbiraAPIFetchManager

**Constructor**:

```javascript
new IbiraAPIFetchManager(options)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `Object` | Configuration options |
| `options.maxCacheSize` | `number` | Max cache entries (default: 100) |
| `options.cacheExpiration` | `number` | Cache TTL (default: 300000ms) |
| `options.cleanupInterval` | `number` | Cleanup interval (default: 60000ms) |
| `options.maxRetries` | `number` | Default max retries (default: 3) |
| `options.retryDelay` | `number` | Default retry delay (default: 1000ms) |
| `options.retryMultiplier` | `number` | Default backoff (default: 2) |
| `options.retryableStatusCodes` | `number[]` | Default retryable codes |

**Instance Methods**:

```javascript
// Fetcher management
const fetcher = manager.getFetcher(url, options)

// Fetch operations
const data = await manager.fetch(url, options)
const results = await manager.fetchMultiple(urls, options)

// Cache operations
const cached = manager.getCachedData(url)
manager.clearCache(url)  // or clearCache() for all
manager.triggerCleanup()

// Configuration
manager.setCacheExpiration(milliseconds)
manager.setMaxCacheSize(size)
manager.setRetryConfig(config)
manager.setRetryConfigForUrl(url, config)

// Monitoring
const loading = manager.isLoading(url)
const stats = manager.getStats()
const config = manager.getRetryConfig()

// Observer pattern
manager.subscribe(url, observer)
manager.unsubscribe(url, observer)

// Cleanup
manager.destroy()
```

---

### 6.2 Utilities API

#### DefaultCache

```javascript
const cache = new DefaultCache(options)

// Map-like interface
cache.has(key)         // boolean
cache.get(key)         // value | undefined
cache.set(key, value)  // void
cache.delete(key)      // boolean
cache.clear()          // void

// Properties
cache.size             // number
cache.entries()        // Iterator
cache.maxSize          // number
cache.expiration       // number
```

#### DefaultEventNotifier

```javascript
const notifier = new DefaultEventNotifier()

// Observer management
notifier.subscribe(observer)    // void
notifier.unsubscribe(observer)  // void
notifier.notify(...args)        // void
notifier.clear()                // void

// Properties
notifier.subscriberCount        // number
```

---

## 7. Usage Examples

### 7.1 Basic Usage

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

// Simple fetch with default cache
const fetcher = IbiraAPIFetcher.withDefaultCache(
  'https://api.example.com/users'
);

try {
  const users = await fetcher.fetchData();
  console.log('Users:', users);
} catch (error) {
  console.error('Fetch failed:', error);
}
```

### 7.2 Custom Cache Configuration

```javascript
import { IbiraAPIFetcher, DefaultCache } from 'ibira.js';

// Create custom cache
const cache = new DefaultCache({
  maxSize: 200,
  expiration: 600000  // 10 minutes
});

// Use custom cache
const fetcher = IbiraAPIFetcher.withExternalCache(
  'https://api.example.com/data',
  cache,
  { timeout: 5000 }
);

const data = await fetcher.fetchData();
```

### 7.3 Observer Pattern

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

// Create observer
const loadingObserver = {
  update(event, payload) {
    switch(event) {
      case 'loading-start':
        console.log('Loading started:', payload.url);
        break;
      case 'success':
        console.log('Data received:', payload);
        break;
      case 'error':
        console.error('Error occurred:', payload.error);
        break;
    }
  }
};

// Subscribe to events
const fetcher = IbiraAPIFetcher.withDefaultCache(url);
fetcher.subscribe(loadingObserver);

// Fetch triggers notifications
await fetcher.fetchData();
```

### 7.4 Multiple Fetchers with Manager

```javascript
import { IbiraAPIFetchManager } from 'ibira.js';

// Create manager
const manager = new IbiraAPIFetchManager({
  maxCacheSize: 200,
  cacheExpiration: 300000,
  maxRetries: 5
});

// Fetch multiple endpoints
const [users, posts, comments] = await manager.fetchMultiple([
  'https://api.example.com/users',
  'https://api.example.com/posts',
  'https://api.example.com/comments'
]);

// Check stats
console.log('Manager stats:', manager.getStats());

// Cleanup when done
manager.destroy();
```

### 7.5 Pure Functional Usage

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

// Create pure fetcher
const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');

// External cache state
let cacheState = new Map();

// Pure fetch with mock network
const mockNetwork = () => Promise.resolve({ test: 'data' });

const result = await fetcher.fetchDataPure(
  cacheState,
  Date.now(),
  mockNetwork
);

if (result.success) {
  // Update cache externally
  cacheState = result.newCacheState;
  console.log('Data:', result.data);
  console.log('Cache operations:', result.cacheOperations);
  console.log('Events:', result.events);
}
```

### 7.6 React Integration

```javascript
import { useState, useEffect } from 'react';
import { IbiraAPIFetcher } from 'ibira.js';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetcher = IbiraAPIFetcher.withEventCallback(
      'https://api.example.com/users',
      (event, payload) => {
        if (event === 'loading-start') setLoading(true);
        if (event === 'success') {
          setUsers(payload);
          setLoading(false);
        }
        if (event === 'error') {
          setError(payload.error);
          setLoading(false);
        }
      }
    );

    fetcher.fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 7.7 Retry Configuration

```javascript
import { IbiraAPIFetchManager } from 'ibira.js';

const manager = new IbiraAPIFetchManager();

// Set global retry config
manager.setRetryConfig({
  maxRetries: 5,
  retryDelay: 2000,
  retryMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
});

// Override for specific URL
manager.setRetryConfigForUrl('https://api.critical.com/data', {
  maxRetries: 10,
  retryDelay: 1000
});

// Fetch with retry
try {
  const data = await manager.fetch('https://api.critical.com/data');
} catch (error) {
  console.error('Failed after retries:', error);
}
```

### 7.8 Shared Cache Between Fetchers

```javascript
import { IbiraAPIFetcher, DefaultCache } from 'ibira.js';

// Single shared cache
const sharedCache = new DefaultCache({ 
  maxSize: 500,
  expiration: 600000 
});

// Multiple fetchers sharing the cache
const userFetcher = IbiraAPIFetcher.withExternalCache(
  'https://api.example.com/users',
  sharedCache
);

const postFetcher = IbiraAPIFetcher.withExternalCache(
  'https://api.example.com/posts',
  sharedCache
);

// Both use the same cache
await userFetcher.fetchData();  // Adds to shared cache
await postFetcher.fetchData();  // Adds to shared cache

console.log('Total cached items:', sharedCache.size);
```

---

## 8. Best Practices

### 8.1 Module Design

#### ✅ DO:

- Keep modules focused (single responsibility)
- Use named exports for clarity
- Document public APIs with JSDoc
- Keep files under 1000 lines
- Use explicit imports

```javascript
// ✅ Good
import { IbiraAPIFetcher } from 'ibira.js';
export class MyClass { ... }
```

#### ❌ DON'T:

- Mix concerns in one module
- Use default exports
- Create circular dependencies
- Have side effects in module scope

```javascript
// ❌ Bad
import * as Ibira from 'ibira.js';
export default class { ... }
```

---

### 8.2 Dependency Management

#### ✅ DO:

- Inject dependencies
- Use interfaces (duck typing)
- Keep dependencies minimal
- Make dependencies explicit

```javascript
// ✅ Good - dependency injection
constructor(url, cache, options = {}) {
  this.cache = cache;  // Injected
  this.eventNotifier = options.eventNotifier || new DefaultEventNotifier();
}
```

#### ❌ DON'T:

- Create dependencies internally
- Use global state
- Hide dependencies

```javascript
// ❌ Bad - hidden dependency
constructor(url) {
  this.cache = new GlobalCache.getInstance();  // Hidden, untestable
}
```

---

### 8.3 Error Handling

#### ✅ DO:

- Use try-catch for async operations
- Provide meaningful error messages
- Log errors appropriately
- Clean up resources on error

```javascript
// ✅ Good
try {
  const data = await fetcher.fetchData();
  return processData(data);
} catch (error) {
  console.error('Failed to fetch data:', error.message);
  notifyUser('Data fetch failed');
  throw error;  // Re-throw if caller should handle
}
```

#### ❌ DON'T:

- Swallow errors silently
- Use generic error messages
- Leave resources dangling

```javascript
// ❌ Bad
try {
  await fetcher.fetchData();
} catch (error) {
  // Silent failure - bad!
}
```

---

### 8.4 Testing

#### ✅ DO:

- Test public APIs
- Use dependency injection for mocking
- Test edge cases
- Test error conditions

```javascript
// ✅ Good - testable with mocks
const mockCache = {
  has: jest.fn(() => false),
  get: jest.fn(),
  set: jest.fn()
};

const fetcher = new IbiraAPIFetcher(url, mockCache);
```

#### ❌ DON'T:

- Test implementation details
- Use real network in tests
- Ignore edge cases

---

### 8.5 Performance

#### ✅ DO:

- Use caching effectively
- Implement request deduplication
- Clean up timers and resources
- Monitor memory usage

```javascript
// ✅ Good - deduplication
if (this.pendingRequests.has(key)) {
  return await this.pendingRequests.get(key);
}
```

#### ❌ DON'T:

- Make redundant requests
- Keep unlimited cache
- Forget to cleanup

---

### 8.6 Code Organization

#### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `IbiraAPIFetcher.js` |
| Utilities | camelCase | `cacheHelper.js` |
| Constants | camelCase | `version.js` |
| Tests | `*.test.js` | `IbiraAPIFetcher.test.js` |

#### Import Order

```javascript
// 1. External dependencies
import { something } from 'external-package';

// 2. Internal core modules
import { IbiraAPIFetcher } from './core/IbiraAPIFetcher.js';

// 3. Internal utils
import { DefaultCache } from './utils/DefaultCache.js';

// 4. Internal config
import { VERSION } from './config/version.js';
```

---

## 9. Contributing Guidelines

### 9.1 Adding New Features

#### Step 1: Determine Module Location

```text
New core class?          → src/core/
New utility function?    → src/utils/
New configuration?       → src/config/
```

#### Step 2: Create Module

```javascript
// src/core/NewFeature.js

/**
 * NewFeature - Description
 * 
 * @class NewFeature
 * @since 0.3.0
 */
export class NewFeature {
  constructor(options = {}) {
    // Implementation
  }
  
  // Methods...
}
```

#### Step 3: Export from index.js

```javascript
// src/index.js
export { NewFeature } from './core/NewFeature.js';
```

#### Step 4: Add Tests

```javascript
// __tests__/NewFeature.test.js
import { NewFeature } from '../src/index.js';

describe('NewFeature', () => {
  test('should work correctly', () => {
    // Test implementation
  });
});
```

#### Step 5: Update Documentation

- Add to this document
- Update README.md
- Add JSDoc comments

---

### 9.2 Modifying Existing Code

#### Guidelines:

1. **Maintain backward compatibility** unless major version bump
2. **Add deprecation warnings** before removing features
3. **Update tests** to cover new behavior
4. **Document breaking changes** in MIGRATION.md

#### Example:

```javascript
/**
 * @deprecated Use newMethod() instead. Will be removed in v1.0.0
 */
oldMethod() {
  console.warn('oldMethod is deprecated, use newMethod');
  return this.newMethod();
}

newMethod() {
  // New implementation
}
```

---

### 9.3 Code Review Checklist

Before submitting:

- [ ] Code follows existing patterns
- [ ] Tests pass (`npm test`)
- [ ] No linting errors
- [ ] Documentation updated
- [ ] JSDoc comments added
- [ ] No breaking changes (or documented)
- [ ] Performance considered
- [ ] Error handling implemented
- [ ] Resources cleaned up

---

## 10. Testing Strategy

### 10.1 Test Organization

```text
__tests__/
├── IbiraAPIFetcher.test.js      # Unit tests for fetcher
├── IbiraAPIFetchManager.test.js # Unit tests for manager
├── DefaultCache.test.js         # Unit tests for cache
└── integration.test.js          # Integration tests
```

### 10.2 Testing Patterns

#### Unit Testing

```javascript
import { IbiraAPIFetcher } from '../src/index.js';

describe('IbiraAPIFetcher', () => {
  describe('Static Factory Methods', () => {
    test('withDefaultCache creates instance with cache', () => {
      const fetcher = IbiraAPIFetcher.withDefaultCache(url);
      expect(fetcher).toBeInstanceOf(IbiraAPIFetcher);
      expect(fetcher.cache).toBeDefined();
    });
  });
  
  describe('fetchData', () => {
    test('returns data from API', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' })
        })
      );
      
      const fetcher = IbiraAPIFetcher.withDefaultCache(url);
      const data = await fetcher.fetchData();
      
      expect(data).toEqual({ data: 'test' });
    });
  });
});
```

#### Integration Testing

```javascript
describe('Integration Tests', () => {
  test('manager coordinates multiple fetchers', async () => {
    const manager = new IbiraAPIFetchManager();
    
    const results = await manager.fetchMultiple([
      'https://api.example.com/users',
      'https://api.example.com/posts'
    ]);
    
    expect(results).toHaveLength(2);
    expect(manager.getStats().activeFetchers).toBe(2);
  });
});
```

#### Pure Function Testing

```javascript
describe('Pure Functions', () => {
  test('fetchDataPure is deterministic', async () => {
    const fetcher = IbiraAPIFetcher.pure(url);
    const cache = new Map();
    const timestamp = 1000000;
    const mockNetwork = () => Promise.resolve({ data: 'test' });
    
    // Call twice with same inputs
    const result1 = await fetcher.fetchDataPure(cache, timestamp, mockNetwork);
    const result2 = await fetcher.fetchDataPure(cache, timestamp, mockNetwork);
    
    // Should produce same structure
    expect(result1.meta.timestamp).toBe(result2.meta.timestamp);
  });
});
```

### 10.3 Test Coverage

Run coverage report:

```bash
npm run test:coverage
```

Target coverage:

- **Lines**: 75%+
- **Functions**: 75%+
- **Branches**: 75%+
- **Statements**: 75%+

### 10.4 Mocking Strategies

#### Mock Network

```javascript
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' })
  })
);
```

#### Mock Cache

```javascript
const mockCache = {
  has: jest.fn(() => false),
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  size: 0,
  entries: jest.fn(() => [])
};
```

#### Mock Observer

```javascript
const mockObserver = {
  update: jest.fn()
};

fetcher.subscribe(mockObserver);
expect(mockObserver.update).toHaveBeenCalledWith('loading-start', expect.any(Object));
```

---

## Conclusion

The Node.js API pattern provides ibira.js with a scalable, maintainable, and professional code structure. By following these guidelines and patterns, contributors can add features consistently while maintaining code quality.

### Key Takeaways

1. **Modular Structure**: Separate concerns into focused modules
2. **Clear Dependencies**: Explicit imports and dependency injection
3. **Design Patterns**: Factory, Observer, Strategy patterns used consistently
4. **Pure Functional Core**: Testable, referentially transparent core
5. **Comprehensive Testing**: Unit, integration, and pure function tests
6. **Professional Standards**: Documentation, conventions, best practices

### Resources

- [Source Code README](../src/README.md)
- [Migration Guide](../MIGRATION.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Test Results](./TEST_RESULTS.md)

---

**Document Maintained By**: ibira.js Core Team  
**Last Updated**: December 15, 2025  
**Version**: 1.0.0
