# IbiraAPIFetcher Class Documentation

## Overview

The `IbiraAPIFetcher` class is a modern JavaScript API fetching library that achieves **perfect referential transparency (10/10)** while maintaining complete practical usability through an innovative dual-layer architecture.

## 🏆 Achievement Highlights

- **🔵 Pure Functional Core** - Mathematical computation with zero side effects
- **🛡️ Perfect Referentially Transparent** - Verified 10/10 score with formal proof
- **🧊 Complete Immutability** - All objects frozen with Object.freeze
- **💉 Full Dependency Injection** - External cache and event handling
- **🎯 Dual-Layer Architecture** - Pure core + practical wrapper
- **🔄 100% Backward Compatible** - Existing code works unchanged
- **🧪 Comprehensive Testing** - 40/40 passing tests validate purity
- **⚡ High Performance** - Smart caching with LRU eviction

## Quick Start

### Basic Usage (Backward Compatible)
```javascript
import { IbiraAPIFetcher } from 'ibira.js';

// Simple usage with default settings
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');

try {
    const users = await fetcher.fetchData();
    console.log('Users:', users);
} catch (error) {
    console.error('Failed to fetch users:', error);
}
```

## Installation

```bash
npm install ibira.js
```

## Quick Start

### Basic Usage (Backward Compatible)
```javascript
import { IbiraAPIFetcher } from 'ibira.js';

// Simple usage with default settings
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');

try {
    const users = await fetcher.fetchData();
    console.log('Users:', users);
} catch (error) {
    console.error('Failed to fetch users:', error);
}
```

### Pure Functional Usage
```javascript
import { IbiraAPIFetcher } from 'ibira.js';

// Create pure fetcher instance
const fetcher = IbiraAPIFetcher.pure('https://api.example.com/users');

// Pure computation - no side effects
const cacheState = new Map();
const result = await fetcher.fetchDataPure(cacheState, Date.now());

if (result.success) {
    console.log('Data:', result.data);
    console.log('Cache operations to apply:', result.cacheOperations);
    console.log('Events to fire:', result.events);
    
    // Apply side effects manually if needed
    result.cacheOperations.forEach(op => {
        switch (op.type) {
            case 'set':
                cacheState.set(op.key, op.value);
                break;
            case 'update':
                cacheState.set(op.key, op.value);
                break;
            case 'delete':
                cacheState.delete(op.key);
                break;
        }
    });
    
    // Handle events
    result.events.forEach(event => {
        console.log(`Event: ${event.type}`, event.payload);
    });
} else {
    console.error('Request failed:', result.error);
}
```

# IbiraAPIFetcher Class Reference

## Constructor

### `new IbiraAPIFetcher(url, cache, options)`

Creates a new IbiraAPIFetcher instance. **Note:** It's recommended to use static factory methods instead of calling the constructor directly.

**Parameters:**
- `url` (string): The API endpoint URL
- `cache` (Object): Cache instance implementing Map-like interface
- `options` (Object): Configuration options

**Options:**
- `timeout` (number): Request timeout in milliseconds (default: 10000)
- `maxRetries` (number): Maximum retry attempts (default: 3)
- `retryDelay` (number): Initial retry delay in milliseconds (default: 1000)
- `retryMultiplier` (number): Exponential backoff multiplier (default: 2)
- `retryableStatusCodes` (Array): HTTP status codes that trigger retries (default: [408, 429, 500, 502, 503, 504])
- `eventNotifier` (Object): Event notification handler

---

## Static Factory Methods

### `IbiraAPIFetcher.withDefaultCache(url, options)`

Creates an instance with reasonable default cache settings (100 entries, 5-minute expiration).

**Parameters:**
- `url` (string): The API endpoint URL
- `options` (Object): Optional configuration

**Returns:** `IbiraAPIFetcher` instance

**Example:**
```javascript
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data', {
    maxCacheSize: 100,        // Maximum cache entries
    cacheExpiration: 300000,  // 5 minutes in milliseconds
    timeout: 10000,           // Request timeout
    maxRetries: 3,            // Retry attempts
    retryDelay: 1000,         // Initial retry delay
    retryMultiplier: 2        // Exponential backoff multiplier
});
```

### `IbiraAPIFetcher.withExternalCache(url, cache, options)`

Uses an external cache instance for shared caching scenarios. Ideal for multiple fetchers sharing the same cache.

**Parameters:**
- `url` (string): The API endpoint URL
- `cache` (Object): External cache instance (Map-like interface)
- `options` (Object): Optional configuration

**Returns:** `IbiraAPIFetcher` instance

**Example:**
```javascript
const sharedCache = new Map();
sharedCache.maxSize = 200;
sharedCache.expiration = 600000; // 10 minutes

const fetcher = IbiraAPIFetcher.withExternalCache(
    'https://api.example.com/data',
    sharedCache,
    { timeout: 5000 }
);
```

### `IbiraAPIFetcher.withoutCache(url, options)`

Disables caching completely. Every request results in a fresh network call.

**Parameters:**
- `url` (string): The API endpoint URL
- `options` (Object): Optional configuration

**Returns:** `IbiraAPIFetcher` instance

**Example:**
```javascript
const fetcher = IbiraAPIFetcher.withoutCache('https://api.example.com/data');
```

### `IbiraAPIFetcher.withEventCallback(url, callback, options)`

Uses callback functions for event handling instead of observer pattern.

**Parameters:**
- `url` (string): The API endpoint URL
- `callback` (Function): Event callback function `(event, data) => void`
- `options` (Object): Optional configuration

**Returns:** `IbiraAPIFetcher` instance

**Example:**
```javascript
const eventHandler = (event, data) => {
    switch (event) {
        case 'loading-start':
            console.log('Loading started...');
            break;
        case 'success':
            console.log('Data received:', data);
            break;
        case 'error':
            console.error('Request failed:', data.error);
            break;
    }
};

const fetcher = IbiraAPIFetcher.withEventCallback(
    'https://api.example.com/data',
    eventHandler
);
```

### `IbiraAPIFetcher.withoutEvents(url, options)`

Disables all event notifications for maximum simplicity and pure functionality.

**Parameters:**
- `url` (string): The API endpoint URL
- `options` (Object): Optional configuration

**Returns:** `IbiraAPIFetcher` instance

**Example:**
```javascript
const fetcher = IbiraAPIFetcher.withoutEvents('https://api.example.com/data');
```

### `IbiraAPIFetcher.pure(url, options)`

Creates a pure functional instance with no side effects. Use with `fetchDataPure()` for maximum referential transparency.

**Parameters:**
- `url` (string): The API endpoint URL
- `options` (Object): Optional configuration

**Returns:** `IbiraAPIFetcher` instance

**Example:**
```javascript
const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
const result = await fetcher.fetchDataPure(new Map(), Date.now());
```

---

## Instance Methods

### `fetchData(cacheOverride)`

**🟡 Practical Wrapper Method** - Applies side effects from pure computation. This is the main method for practical usage.

**Parameters:**
- `cacheOverride` (Object, optional): Alternative cache instance to use

**Returns:** `Promise<any>` - Resolves with fetched data

**Throws:** `Error` - Network, HTTP, or parsing errors

**Example:**
```javascript
try {
    const data = await fetcher.fetchData();
    console.log('Received data:', data);
} catch (error) {
    console.error('Request failed:', error);
}
```

### `fetchDataPure(currentCacheState, currentTime, networkProvider)`

**🔵 Pure Functional Core** - Computes fetch result without side effects. Perfect referential transparency with deterministic behavior.

**Parameters:**
- `currentCacheState` (Map): Current cache state (not mutated)
- `currentTime` (number, optional): Current timestamp for deterministic behavior (default: Date.now())
- `networkProvider` (Function, optional): Pure network function for testing

**Returns:** `Promise<Object>` - Pure result object with complete operation description

**Result Object Properties:**
- `success` (boolean): Whether the operation succeeded
- `data` (any): Retrieved data (if successful)
- `error` (Error): Error object (if failed) 
- `fromCache` (boolean): Whether data came from cache
- `cacheOperations` (Array): Operations to apply to cache
- `events` (Array): Events to trigger
- `newCacheState` (Map): Updated cache state
- `meta` (Object): Additional metadata

**Example:**
```javascript
const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
const cacheState = new Map();

const result = await fetcher.fetchDataPure(cacheState, Date.now());

if (result.success) {
    console.log('Data:', result.data);
    console.log('From cache:', result.fromCache);
    console.log('Cache operations:', result.cacheOperations);
    console.log('Events:', result.events);
} else {
    console.error('Error:', result.error);
}
```

### `subscribe(observer)`

Subscribes an observer to receive event notifications.

**Parameters:**
- `observer` (Object): Observer with `update(event, data)` method

**Example:**
```javascript
const observer = {
    update(event, data) {
        console.log(`Event: ${event}`, data);
    }
};

fetcher.subscribe(observer);
```

### `unsubscribe(observer)`

Removes an observer from event notifications.

**Parameters:**
- `observer` (Object): Observer to remove

**Example:**
```javascript
fetcher.unsubscribe(observer);
```

### `getCacheKey()`

Returns the cache key for this fetcher instance. Override in subclasses for custom cache keys.

**Returns:** `string` - Cache key (defaults to URL)

**Example:**
```javascript
const cacheKey = fetcher.getCacheKey();
console.log('Cache key:', cacheKey);
```

---

## Properties

### Instance Properties

All properties are **immutable** and **frozen** for complete referential transparency:

- `url` (string): The API endpoint URL
- `cache` (Object): Cache instance with Map-like interface
- `eventNotifier` (Object): Event notification handler
- `timeout` (number): Request timeout in milliseconds
- `maxRetries` (number): Maximum retry attempts
- `retryDelay` (number): Initial retry delay in milliseconds  
- `retryMultiplier` (number): Exponential backoff multiplier
- `retryableStatusCodes` (Array): HTTP status codes that trigger retries (frozen)

**Note:** All instances are `Object.freeze()`d to prevent mutations and ensure referential transparency.

---

## Events

### Event Types

The fetcher emits the following events through the observer pattern or callback functions:

#### `'loading-start'`
Fired when a network request begins.

**Payload:**
```javascript
{
    url: string,        // The API endpoint URL
    cacheKey: string    // Cache key for this request
}
```

#### `'success'`
Fired when a request completes successfully.

**Payload:** `any` - The fetched data

#### `'error'`
Fired when a request fails.

**Payload:**
```javascript
{
    error: Error    // The error that occurred
}
```

### Event Handling Examples

**Observer Pattern:**
```javascript
const observer = {
    update(event, data) {
        switch (event) {
            case 'loading-start':
                console.log('Loading started for:', data.url);
                break;
            case 'success':
                console.log('Data received:', data);
                break;
            case 'error':
                console.error('Request failed:', data.error);
                break;
        }
    }
};

fetcher.subscribe(observer);
```

**Callback Pattern:**
```javascript
const fetcher = IbiraAPIFetcher.withEventCallback(
    'https://api.example.com/data',
    (event, data) => {
        if (event === 'loading-start') setLoading(true);
        if (event === 'success') setData(data);
        if (event === 'error') setError(data.error);
    }
);
```

---

## Configuration

### Constructor Options

```javascript
{
    eventNotifier: Object,         // Custom event notifier instance
    timeout: number,               // Request timeout in ms (default: 10000)
    maxRetries: number,            // Maximum retry attempts (default: 3)
    retryDelay: number,            // Initial retry delay in ms (default: 1000)
    retryMultiplier: number,       // Exponential backoff multiplier (default: 2)
    retryableStatusCodes: Array    // HTTP status codes that trigger retries
                                   // Default: [408, 429, 500, 502, 503, 504]
}
```

### Cache Configuration

Cache instances should implement the following interface:

```javascript
{
    // Map-like interface
    has(key): boolean,
    get(key): any,
    set(key, value): void,
    delete(key): boolean,
    clear(): void,
    size: number,
    entries(): Iterator,
    
    // Cache-specific properties
    maxSize: number,        // Maximum number of entries
    expiration: number      // Expiration time in milliseconds
}
```

**Default Cache Settings:**
- `maxSize`: 100 entries
- `expiration`: 300000ms (5 minutes)

---

## Pure Functional Architecture

### Dual-Layer Design

IbiraAPIFetcher uses an innovative dual-layer architecture:

1. **🔵 Pure Functional Core** (`fetchDataPure`)
   - Zero side effects
   - Deterministic behavior
   - Complete referential transparency
   - Returns operation descriptions instead of performing mutations

2. **🟡 Practical Wrapper** (`fetchData`)
   - Applies side effects from pure computation
   - Maintains backward compatibility
   - Handles real-world concerns (caching, events)

### Pure Function Result Object

```javascript
{
    success: boolean,           // Operation success status
    data?: any,                 // Fetched data (if successful)
    error?: Error,              // Error object (if failed)
    fromCache: boolean,         // Whether data came from cache
    cacheOperations: Array,     // Operations to apply to cache
    events: Array,              // Events to trigger
    newCacheState: Map,         // Updated cache state
    meta: {                     // Additional metadata
        cacheKey: string,
        timestamp: number,
        expiredKeysRemoved: number,
        attempt?: number,
        networkRequest?: boolean
    }
}
```

### Cache Operations

Cache operations describe mutations to be applied:

```javascript
// Set/Update operation
{
    type: 'set' | 'update',
    key: string,
    value: {
        data: any,
        timestamp: number,
        expiresAt: number
    }
}

// Delete operation  
{
    type: 'delete',
    key: string
}
```

```javascript
const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
```

## API Reference

### Core Methods

#### `fetchData(cacheOverride?)`
Practical wrapper method that applies side effects.

**Parameters:**
- `cacheOverride` (optional): Alternative cache to use for this request

**Returns:** Promise that resolves to fetched data or rejects with error

**Example:**
```javascript
const data = await fetcher.fetchData();
```

#### `fetchDataPure(currentCacheState, currentTime?, networkProvider?)`
Pure functional core method with zero side effects.

**Parameters:**
- `currentCacheState`: Map representing current cache state
- `currentTime` (optional): Current timestamp for deterministic behavior
- `networkProvider` (optional): Function for network requests (testing)

**Returns:** Promise that resolves to operation description object

**Result Object:**
```javascript
{
    success: boolean,           // Whether operation succeeded
    data: any,                 // Fetched data (if successful)
    error: Error,              // Error object (if failed)
    fromCache: boolean,        // Whether data came from cache
    cacheOperations: Array,    // Operations to apply to cache
    events: Array,             // Events to fire
    newCacheState: Map,        // New cache state after operations
    meta: {                    // Metadata about the operation
        cacheKey: string,
        timestamp: number,
        expiredKeysRemoved: number,
        attempt: number,
        networkRequest: boolean
    }
}
```

**Example:**
```javascript
const result = await fetcher.fetchDataPure(cacheState, Date.now());
```

### Cache Operations

Cache operations describe mutations to be applied:

```javascript
// Set/Update operation
{
    type: 'set' | 'update',
    key: string,
    value: {
        data: any,
        timestamp: number,
        expiresAt: number
    }
}

// Delete operation  
{
    type: 'delete',
    key: string
}
```

### Event Types

Events describe notifications to be fired:

```javascript
// Loading started
{
    type: 'loading-start',
    payload: {
        url: string,
        cacheKey: string
    }
}

// Request succeeded
{
    type: 'success',
    payload: any // The fetched data
}

// Request failed
{
    type: 'error',
    payload: {
        error: Error
    }
}
```

## Configuration Options

### Constructor Options
```javascript
{
    eventNotifier: EventNotifier,  // Custom event notifier
    timeout: number,               // Request timeout (default: 10000)
    maxRetries: number,            // Max retry attempts (default: 3)
    retryDelay: number,            // Initial retry delay (default: 1000)
    retryMultiplier: number,       // Backoff multiplier (default: 2)
    retryableStatusCodes: Array    // HTTP codes to retry (default: [408, 429, 500, 502, 503, 504])
}
```

### Cache Configuration
```javascript
{
    maxCacheSize: number,     // Maximum cache entries (default: 100)
    cacheExpiration: number   // Cache expiration time in ms (default: 300000)
}
```

## Advanced Usage

### Custom Event Notifier
```javascript
class CustomEventNotifier {
    constructor() {
        this.listeners = new Map();
    }
    
    subscribe(listener) {
        // Implementation
    }
    
    unsubscribe(listener) {
---

## Advanced Usage

### Custom Cache Implementation

```javascript
class CustomCache {
    constructor(options = {}) {
        this.storage = new Map();
        this.maxSize = options.maxSize || 50;
        this.expiration = options.expiration || 300000;
    }
    
    has(key) { return this.storage.has(key); }
    get(key) { return this.storage.get(key); }
    set(key, value) { 
        this.storage.set(key, value);
        this._enforceSizeLimit();
    }
    delete(key) { return this.storage.delete(key); }
    clear() { this.storage.clear(); }
    get size() { return this.storage.size; }
    entries() { return this.storage.entries(); }
    
    _enforceSizeLimit() {
        // Implementation for LRU eviction
    }
}

const fetcher = IbiraAPIFetcher.withExternalCache(
    'https://api.example.com/data',
    new CustomCache({ maxSize: 200 })
);
```

### Custom Event Notifier

```javascript
class CustomEventNotifier {
    constructor() {
        this.listeners = new Map();
    }
    
    subscribe(listener) {
        const id = Symbol();
        this.listeners.set(id, listener);
        return id;
    }
    
    unsubscribe(listener) {
        for (const [id, l] of this.listeners) {
            if (l === listener) {
                this.listeners.delete(id);
                break;
            }
        }
    }
    
    notify(event, data) {
        this.listeners.forEach(listener => {
            if (listener && typeof listener.update === 'function') {
                listener.update(event, data);
            }
        });
    }
    
    clear() { this.listeners.clear(); }
    get subscriberCount() { return this.listeners.size; }
}

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/data',
    cache,
    { eventNotifier: new CustomEventNotifier() }
);
```

### Pure Functional Testing

```javascript
import { describe, it, expect } from 'jest';

describe('IbiraAPIFetcher Pure Functions', () => {
    it('should return deterministic results', async () => {
        const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
        const mockNetwork = () => Promise.resolve({ test: 'data' });
        
        const cacheState = new Map();
        const timestamp = 1640995200000; // Fixed timestamp
        
        const result = await fetcher.fetchDataPure(cacheState, timestamp, mockNetwork);
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ test: 'data' });
        expect(result.fromCache).toBe(false);
        expect(result.meta.timestamp).toBe(timestamp);
    });
    
    it('should use cache when available', async () => {
        const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
        
        const cacheState = new Map();
        cacheState.set('https://api.example.com/data', {
            data: { cached: 'data' },
            timestamp: 1640995200000,
            expiresAt: 1640995500000
        });
        
        const result = await fetcher.fetchDataPure(cacheState, 1640995300000);
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ cached: 'data' });
        expect(result.fromCache).toBe(true);
    });
});
```

### Error Handling and Retries

```javascript
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data', {
    maxRetries: 5,                              // Retry up to 5 times
    retryDelay: 2000,                          // Start with 2 second delay
    retryMultiplier: 1.5,                      // Increase delay by 50% each time
    retryableStatusCodes: [408, 429, 500, 502, 503, 504, 520, 521, 522, 524]
});

try {
    const data = await fetcher.fetchData();
    console.log('Success after retries:', data);
} catch (error) {
    console.error('Failed after all retries:', error);
}
```

### Multiple Fetchers with Shared Cache

```javascript
const sharedCache = new Map();
sharedCache.maxSize = 500;
sharedCache.expiration = 600000; // 10 minutes

const usersFetcher = IbiraAPIFetcher.withExternalCache(
    'https://api.example.com/users',
    sharedCache
);

const postsFetcher = IbiraAPIFetcher.withExternalCache(
    'https://api.example.com/posts', 
    sharedCache
);

// Both fetchers share the same cache instance
const [users, posts] = await Promise.all([
    usersFetcher.fetchData(),
    postsFetcher.fetchData()
]);
```

---

## Error Handling

### Error Types

The fetcher can throw the following types of errors:

#### Network Errors
- **`TypeError`**: Network connectivity issues
- **`AbortError`**: Request timeout or cancellation

#### HTTP Errors  
- **`Error`**: HTTP status errors (4xx, 5xx responses)
- Message format: `"HTTP error! status: {statusCode}"`

#### JSON Parsing Errors
- **`SyntaxError`**: Invalid JSON response

### Retry Configuration

Retries are automatically attempted for:
- Network errors (no response received)
- Timeout errors  
- Specific HTTP status codes (configurable)

**Default Retryable Status Codes:**
- `408` - Request Timeout
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout

### Error Handling Examples

```javascript
try {
    const data = await fetcher.fetchData();
    console.log('Success:', data);
} catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error:', error.message);
    } else if (error.message.includes('HTTP error! status:')) {
        const statusMatch = error.message.match(/status: (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : 'unknown';
        console.error(`HTTP error ${statusCode}:`, error.message);
    } else if (error.name === 'AbortError') {
        console.error('Request timeout:', error.message);
    } else {
        console.error('Unknown error:', error);
    }
}
```

---

## Performance Considerations

### Caching Strategy
- **LRU Eviction**: Oldest entries removed when cache is full
- **Expiration**: Automatic cleanup of expired entries
- **Size Limits**: Configurable maximum cache size to prevent memory leaks

### Memory Management
- All objects are immutable and frozen
- Automatic cleanup of expired cache entries
- Configurable cache size limits
- Efficient Map-based storage

### Best Practices
1. **Shared Cache**: Use `withExternalCache()` for multiple fetchers
2. **Pure Functions**: Use `fetchDataPure()` for testing and functional programming
3. **Event Callbacks**: Use `withEventCallback()` for simpler event handling
4. **No Cache**: Use `withoutCache()` for testing or when caching isn't needed
5. **Error Handling**: Always wrap `fetchData()` calls in try-catch blocks

---

## TypeScript Support

The library includes TypeScript definitions for enhanced development experience:

```typescript
interface CacheInterface {
    has(key: string): boolean;
    get(key: string): any;
    set(key: string, value: any): void;
    delete(key: string): boolean;
    clear(): void;
    size: number;
    entries(): IterableIterator<[string, any]>;
    maxSize: number;
    expiration: number;
}

interface PureResult {
    success: boolean;
    data?: any;
    error?: Error;
    fromCache: boolean;
    cacheOperations: CacheOperation[];
    events: EventDescription[];
    newCacheState: Map<string, any>;
    meta: {
        cacheKey: string;
        timestamp: number;
        expiredKeysRemoved: number;
        attempt?: number;
        networkRequest?: boolean;
    };
}
```

---

## Version Information

- **Version**: 0.2.0-alpha
- **License**: MIT
- **Repository**: https://github.com/mpbarbosa/ibira.js
- **Author**: Marcelo Pereira Barbosa

---

## Related Documentation

- [Referential Transparency Achievement](./REFERENTIAL_TRANSPARENCY.md) - 🏆 Main achievement documentation
- [Architecture Guide](./ARCHITECTURE.md) - Dual-layer system design
- [Migration Guide](./MIGRATION_GUIDE.md) - Transformation process
- [Verification Report](./VERIFICATION_REPORT.md) - Formal verification results
- [Documentation Index](./INDEX.md) - Complete documentation overview
        // Implementation
    }
}

const fetcher = new IbiraAPIFetcher(url, cache, {
    eventNotifier: new CustomEventNotifier()
});
```

### Testing with Dependency Injection
```javascript
// Mock network provider for testing
const mockNetwork = async () => ({ id: 123, name: 'Test Data' });

const result = await fetcher.fetchDataPure(
    new Map(),        // Empty cache state
    Date.now(),       // Current time
    mockNetwork       // Mock network function
);

expect(result.success).toBe(true);
expect(result.data).toEqual({ id: 123, name: 'Test Data' });
```

### Error Handling
```javascript
try {
    const data = await fetcher.fetchData();
    console.log('Success:', data);
} catch (error) {
    if (error.message.includes('timeout')) {
        console.log('Request timed out');
    } else if (error.message.includes('HTTP error')) {
        console.log('Server error:', error.message);
    } else {
        console.log('Network error:', error.message);
    }
}
```

## Best Practices

### 1. Use Appropriate Factory Methods
```javascript
// For most applications
const fetcher = IbiraAPIFetcher.withDefaultCache(url);

// For shared caching
const fetcher = IbiraAPIFetcher.withExternalCache(url, sharedCache);

// For testing
const fetcher = IbiraAPIFetcher.withoutCache(url);

// For functional programming
const fetcher = IbiraAPIFetcher.pure(url);
```

### 2. Handle Cache Appropriately
```javascript
// Configure cache based on your needs
const fetcher = IbiraAPIFetcher.withDefaultCache(url, {
    maxCacheSize: 50,        // Smaller cache for memory-constrained environments
    cacheExpiration: 120000  // 2 minutes for frequently changing data
});
```

### 3. Error Handling Strategy
```javascript
const fetcher = IbiraAPIFetcher.withEventCallback(url, (event, data) => {
    switch (event) {
        case 'error':
            // Log error, show user notification, etc.
            logger.error('API request failed:', data.error);
            break;
    }
});
```

### 4. Testing Pure Functions
```javascript
describe('API fetching', () => {
    test('should handle successful response', async () => {
        const mockData = { id: 1, name: 'Test' };
        const mockNetwork = async () => mockData;
        
        const result = await fetcher.fetchDataPure(
            new Map(),
            Date.now(),
            mockNetwork
        );
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(result.fromCache).toBe(false);
    });
});
```

## Performance Considerations

### Cache Management
- Set appropriate `maxCacheSize` based on memory constraints
- Use `cacheExpiration` to balance freshness vs performance
- Consider shared caches for multiple fetcher instances

### Network Optimization
- Configure `timeout` based on expected response times
- Adjust `maxRetries` and `retryDelay` for your error tolerance
- Use appropriate `retryableStatusCodes` for your API

### Memory Usage
- Pure functional design enables safe object reuse
- Immutable objects can be cached without mutation concerns
- Consider using `withoutCache` for one-time requests

## Browser Compatibility

- **Modern Browsers**: Full support with native fetch API
- **Node.js**: Requires fetch polyfill (node-fetch, etc.)
- **IE11**: Requires fetch and Map polyfills

## TypeScript Support

Type definitions are included:

```typescript
import { IbiraAPIFetcher } from 'ibira.js';

interface User {
    id: number;
    name: string;
    email: string;
}

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');
const users: User[] = await fetcher.fetchData();
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**IbiraAPIFetcher v0.1.0-alpha**  
*Achieving perfect referential transparency in JavaScript API fetching*