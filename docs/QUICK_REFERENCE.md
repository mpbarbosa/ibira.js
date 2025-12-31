# ibira.js Quick Reference Guide

**Quick lookup for common tasks and patterns**

---

## Installation

```bash
npm install ibira.js
```

---

## Basic Imports

```javascript
// Main classes
import { IbiraAPIFetcher, IbiraAPIFetchManager } from 'ibira.js';

// Utilities (optional)
import { DefaultCache, DefaultEventNotifier, VERSION } from 'ibira.js';
```

---

## Quick Start Examples

### 1. Simple Fetch with Default Cache

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache(
  'https://api.example.com/users'
);

const users = await fetcher.fetchData();
console.log(users);
```

### 2. Fetch Without Cache

```javascript
const fetcher = IbiraAPIFetcher.withoutCache(
  'https://api.example.com/fresh-data'
);

const data = await fetcher.fetchData();
```

### 3. Custom Cache Configuration

```javascript
const fetcher = IbiraAPIFetcher.withDefaultCache(
  'https://api.example.com/data',
  {
    maxCacheSize: 200,
    cacheExpiration: 600000,  // 10 minutes
    timeout: 5000
  }
);
```

### 4. Using the Manager

```javascript
import { IbiraAPIFetchManager } from 'ibira.js';

const manager = new IbiraAPIFetchManager({
  maxCacheSize: 100,
  cacheExpiration: 300000
});

const data = await manager.fetch('https://api.example.com/data');
```

### 5. Observer Pattern

```javascript
const observer = {
  update(event, payload) {
    console.log(`Event: ${event}`, payload);
  }
};

fetcher.subscribe(observer);
await fetcher.fetchData();
```

---

## Common Patterns

### Multiple Concurrent Requests

```javascript
const manager = new IbiraAPIFetchManager();

const results = await manager.fetchMultiple([
  'https://api.example.com/users',
  'https://api.example.com/posts',
  'https://api.example.com/comments'
]);
```

### Shared Cache

```javascript
import { DefaultCache, IbiraAPIFetcher } from 'ibira.js';

const sharedCache = new DefaultCache({ maxSize: 500 });

const fetcher1 = IbiraAPIFetcher.withExternalCache(url1, sharedCache);
const fetcher2 = IbiraAPIFetcher.withExternalCache(url2, sharedCache);
```

### Retry Configuration

```javascript
const fetcher = IbiraAPIFetcher.withDefaultCache(url, {
  maxRetries: 5,
  retryDelay: 2000,
  retryMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
});
```

### Event Callback

```javascript
const fetcher = IbiraAPIFetcher.withEventCallback(
  url,
  (event, data) => {
    if (event === 'loading-start') setLoading(true);
    if (event === 'success') setData(data);
    if (event === 'error') setError(data.error);
  }
);
```

---

## API Cheat Sheet

### IbiraAPIFetcher Static Methods

| Method | Description |
|--------|-------------|
| `withDefaultCache(url, options)` | Default cache (100 entries, 5 min) |
| `withExternalCache(url, cache, options)` | Use your own cache |
| `withoutCache(url, options)` | No caching |
| `withEventCallback(url, callback, options)` | Event-driven |
| `withoutEvents(url, options)` | No event notifications |
| `pure(url, options)` | Pure functional |

### IbiraAPIFetcher Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `fetchData()` | `Promise<any>` | Fetch with side effects |
| `fetchDataPure(cache, time, network)` | `Promise<Object>` | Pure fetch |
| `subscribe(observer)` | `void` | Add observer |
| `unsubscribe(observer)` | `void` | Remove observer |
| `getCacheKey()` | `string` | Get cache key |

### IbiraAPIFetchManager Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getFetcher(url, options)` | `IbiraAPIFetcher` | Get/create fetcher |
| `fetch(url, options)` | `Promise<any>` | Fetch with deduplication |
| `fetchMultiple(urls, options)` | `Promise<any[]>` | Batch fetch |
| `getCachedData(url)` | `any` | Get from cache |
| `clearCache(url)` | `void` | Clear cache |
| `isLoading(url)` | `boolean` | Check loading state |
| `getStats()` | `Object` | Get statistics |
| `destroy()` | `void` | Cleanup |

---

## Configuration Options

### Common Options

```javascript
{
  timeout: 10000,              // Request timeout (ms)
  maxRetries: 3,               // Max retry attempts
  retryDelay: 1000,            // Initial retry delay (ms)
  retryMultiplier: 2,          // Exponential backoff multiplier
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  maxCacheSize: 100,           // Max cache entries
  cacheExpiration: 300000,     // Cache TTL (ms)
  eventNotifier: customNotifier // Custom event notifier
}
```

---

## Error Handling

```javascript
try {
  const data = await fetcher.fetchData();
  // Process data
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Request timed out');
  } else if (error.message.includes('HTTP error')) {
    console.error('HTTP error:', error.message);
  } else {
    console.error('Fetch failed:', error);
  }
}
```

---

## Testing

### Mock Network

```javascript
const mockNetwork = () => Promise.resolve({ test: 'data' });

const result = await fetcher.fetchDataPure(
  new Map(),
  Date.now(),
  mockNetwork
);
```

### Mock Cache

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

const fetcher = new IbiraAPIFetcher(url, mockCache);
```

---

## File Structure Quick Reference

```
src/
├── index.js              # Import from here
├── core/
│   ├── IbiraAPIFetcher.js
│   └── IbiraAPIFetchManager.js
├── utils/
│   ├── DefaultCache.js
│   └── DefaultEventNotifier.js
└── config/
    └── version.js
```

---

## Common Issues

### Issue: Import not found
**Solution**: Use correct import path
```javascript
import { IbiraAPIFetcher } from 'ibira.js';  // ✅ Correct
import IbiraAPIFetcher from 'ibira.js';       // ❌ Wrong (no default export)
```

### Issue: Cache not working
**Solution**: Check cache configuration
```javascript
// Ensure cache is properly configured
const cache = new DefaultCache({
  maxSize: 100,
  expiration: 300000
});
```

### Issue: Events not firing
**Solution**: Subscribe observer before fetching
```javascript
fetcher.subscribe(observer);  // Subscribe first
await fetcher.fetchData();     // Then fetch
```

---

## Further Reading

- [Complete Node.js API Pattern Guide](./NODE_API_PATTERN.md)
- [API Reference](./IBIRA_API_FETCHER.md)
- [Architecture](./ARCHITECTURE.md)
- [Structure Diagrams](./STRUCTURE_DIAGRAM.md)

---

**Last Updated**: December 15, 2025  
**Version**: 0.2.1-alpha
