# IbiraAPIFetcher Documentation

## Overview

IbiraAPIFetcher is a modern JavaScript library for API data fetching that achieves **perfect referential transparency** while maintaining practical usability through a dual-layer architecture.

## Key Features

- 🔵 **Pure Functional Core** - Zero side effects, deterministic behavior
- 🛡️ **Referentially Transparent** - Perfect 10/10 score achieved
- 🧊 **Immutable Objects** - All returns frozen with Object.freeze
- 💉 **Dependency Injection** - External cache and event handling
- 🔄 **Backward Compatible** - Existing code continues to work
- 🧪 **Highly Testable** - Pure functions enable reliable testing
- ⚡ **Performance Optimized** - Safe caching and parallel execution

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

## Installation

```bash
npm install ibira.js
```

## Factory Methods

### `withDefaultCache(url, options)`
Creates an instance with reasonable default cache settings.

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

### `withExternalCache(url, cache, options)`
Uses an external cache instance for shared caching scenarios.

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

### `withoutCache(url, options)`
Disables caching for testing or simple scenarios.

```javascript
const fetcher = IbiraAPIFetcher.withoutCache('https://api.example.com/data');
```

### `withEventCallback(url, callback, options)`
Uses callback functions for event handling.

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

### `withoutEvents(url, options)`
Disables event notifications for maximum simplicity.

```javascript
const fetcher = IbiraAPIFetcher.withoutEvents('https://api.example.com/data');
```

### `pure(url, options)`
Creates a pure functional instance for functional programming patterns.

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
        // Implementation  
    }
    
    notify(event, data) {
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