# Frequently Asked Questions (FAQ)

## General Questions

### What is ibira.js?

**ibira.js** is a JavaScript library for fetching and caching API data with observer pattern support. It achieves **perfect referential transparency (10/10)** while maintaining practical usability through a dual-layer architecture.

### Why should I use ibira.js instead of plain fetch?

ibira.js provides:
- **Built-in caching** - Automatic response caching with configurable TTL
- **Retry logic** - Automatic retries with exponential backoff
- **Observer pattern** - Event notifications for fetch lifecycle
- **Error handling** - Comprehensive error management
- **Pure functional core** - Predictable, testable code
- **TypeScript support** - Type definitions included

### Is ibira.js production-ready?

ibira.js is currently in **alpha** (v0.2.1-alpha). It has:
- ✅ 90%+ test coverage (152 tests)
- ✅ Comprehensive error handling
- ✅ Backward compatibility guarantee
- ⚠️ API may change before stable release

We recommend thorough testing in your specific use case before production deployment.

## Installation & Setup

### How do I install ibira.js?

```bash
npm install ibira.js
```

### Can I use ibira.js in the browser?

Yes! You can use it via CDN:

```html
<script type="module">
  import { IbiraAPIFetcher } from 'https://cdn.jsdelivr.net/npm/ibira.js@0.2.1-alpha/src/index.js';
  
  const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
  const data = await fetcher.fetchData();
  console.log(data);
</script>
```

### Does ibira.js work with Node.js?

Yes, but you need a fetch polyfill for Node.js versions < 18:

```bash
npm install node-fetch
```

```javascript
// For Node.js < 18
import fetch from 'node-fetch';
global.fetch = fetch;

import { IbiraAPIFetcher } from 'ibira.js';
```

Node.js 18+ has native fetch support, no polyfill needed.

## Usage Questions

### How do I make a simple GET request?

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');
const users = await fetcher.fetchData();
// Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }, ...]
```

### How do I make a POST request?

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

const newUser = await fetcher.fetchData();
```

### How do I add authentication headers?

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/protected', {
    headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    }
});

const data = await fetcher.fetchData();
```

### How do I disable caching for a specific request?

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/realtime',
    {
        cache: new DefaultCache(),
        eventNotifier: new DefaultEventNotifier(),
        enableCache: false  // Disable caching
    }
);

const data = await fetcher.fetchData();
```

### How do I clear the cache?

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');

// Fetch data (will be cached)
await fetcher.fetchData();

// Clear the cache
fetcher.clearCache();

// Next fetch will be fresh (not from cache)
await fetcher.fetchData();
```

### How do I handle errors?

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');

try {
    const data = await fetcher.fetchData();
    console.log('Success:', data);
} catch (error) {
    if (error.name === 'TypeError') {
        console.error('Network error:', error.message);
    } else if (error.message.includes('HTTP error')) {
        console.error('API error:', error.message);
    } else if (error.name === 'AbortError') {
        console.error('Request timeout:', error.message);
    } else {
        console.error('Unknown error:', error);
    }
}
```

## Caching Questions

### How long are responses cached by default?

Default cache expiration is **5 minutes (300,000 ms)**.

### Can I change the cache expiration time?

Yes:

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/data',
    {
        cache: new DefaultCache({ 
            expiration: 600000  // 10 minutes
        }),
        eventNotifier: new DefaultEventNotifier()
    }
);
```

### What is the maximum cache size?

Default maximum cache size is **50 entries**. Oldest entries are evicted when the limit is reached (LRU policy).

### Can I increase the cache size?

Yes:

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/data',
    {
        cache: new DefaultCache({ 
            maxSize: 100  // Store up to 100 entries
        }),
        eventNotifier: new DefaultEventNotifier()
    }
);
```

### Can I use a custom cache implementation?

Yes! Implement the cache interface:

```javascript
class MyCustomCache {
    constructor() {
        this.storage = new Map();
    }
    
    has(key) { return this.storage.has(key); }
    get(key) { return this.storage.get(key); }
    set(key, value) { this.storage.set(key, value); }
    delete(key) { return this.storage.delete(key); }
    clear() { this.storage.clear(); }
    get size() { return this.storage.size; }
    entries() { return this.storage.entries(); }
}

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/data',
    {
        cache: new MyCustomCache(),
        eventNotifier: new DefaultEventNotifier()
    }
);
```

## Retry & Timeout Questions

### How many times does ibira.js retry failed requests?

Default is **3 retries** with **1 second (1000ms)** delay between attempts.

### Can I configure retry behavior?

Yes:

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/data',
    {
        cache: new DefaultCache(),
        eventNotifier: new DefaultEventNotifier(),
        maxRetries: 5,      // Retry up to 5 times
        retryDelay: 2000    // Wait 2 seconds between retries
    }
);
```

### What is the default timeout?

Default timeout is **30 seconds (30,000 ms)**.

### Can I change the timeout?

Yes:

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/data',
    {
        cache: new DefaultCache(),
        eventNotifier: new DefaultEventNotifier(),
        timeout: 10000  // 10 second timeout
    }
);
```

### Which errors trigger retries?

Retries are triggered for:
- Network errors (connection failures)
- Timeout errors (AbortError)
- Server errors (5xx status codes)

**NOT retried:**
- Client errors (4xx status codes like 400, 401, 403, 404)
- Successful responses (2xx status codes)

## Observer Pattern Questions

### What is the observer pattern in ibira.js?

The observer pattern allows you to subscribe to fetch lifecycle events:
- `fetch:start` - Request started
- `fetch:success` - Request succeeded
- `fetch:error` - Request failed
- `cache:hit` - Data served from cache
- `cache:miss` - Data not in cache

### How do I subscribe to events?

```javascript
import { IbiraAPIFetcher, DefaultEventNotifier } from 'ibira.js';

const eventNotifier = new DefaultEventNotifier();

// Create observer
const observer = {
    update(event, data) {
        console.log(`Event: ${event}`, data);
    }
};

// Subscribe
eventNotifier.subscribe(observer);

const fetcher = IbiraAPIFetcher.withDefaultCache(
    'https://api.example.com/data',
    { eventNotifier }
);

await fetcher.fetchData();
```

### How do I unsubscribe from events?

```javascript
eventNotifier.unsubscribe(observer);
```

### Can I have multiple observers?

Yes! You can subscribe multiple observers to the same eventNotifier:

```javascript
const logger = { update: (event, data) => console.log(event, data) };
const analytics = { update: (event, data) => trackEvent(event, data) };
const uiUpdater = { update: (event, data) => updateUI(event, data) };

eventNotifier.subscribe(logger);
eventNotifier.subscribe(analytics);
eventNotifier.subscribe(uiUpdater);
```

## Advanced Questions

### What is "referential transparency"?

Referential transparency means a function always returns the same output for the same inputs, with no side effects. ibira.js achieves this through:
- Pure functional core (`fetchDataPure`)
- Dependency injection (cache, eventNotifier)
- Immutable return values (Object.freeze)

### When should I use the pure functional API?

Use `fetchDataPure()` when you need:
- Maximum testability
- Side-effect isolation
- Explicit control over when side effects occur
- Functional programming paradigms

### How do I use IbiraAPIFetchManager?

For managing multiple API endpoints:

```javascript
import { IbiraAPIFetchManager, DefaultCache } from 'ibira.js';

const manager = new IbiraAPIFetchManager({ 
    cache: new DefaultCache() 
});

manager.addFetcher('users', 'https://api.example.com/users');
manager.addFetcher('posts', 'https://api.example.com/posts');

// Fetch all in parallel
const results = await manager.fetchAll();
console.log('Users:', results.users);
console.log('Posts:', results.posts);
```

### Can I use ibira.js with React?

Yes! Here's a basic example:

```javascript
import { useState, useEffect } from 'react';
import { IbiraAPIFetcher } from 'ibira.js';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetcher = IbiraAPIFetcher.withDefaultCache(
            'https://api.example.com/users'
        );
        
        fetcher.fetchData()
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <ul>
            {users.map(user => <li key={user.id}>{user.name}</li>)}
        </ul>
    );
}
```

### Does ibira.js support TypeScript?

Yes! Type definitions are included:

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

## Troubleshooting

### My requests are not being cached

Check:
1. Is `enableCache` set to `true`? (default is `true`)
2. Are you using the same URL for repeated requests?
3. Has the cache expired? (default: 5 minutes)
4. Is cache size exceeded? (default max: 50 entries)

### I'm getting CORS errors

CORS errors occur when the API server doesn't allow cross-origin requests. This is **not an ibira.js issue**.

Solutions:
- Configure the API server to allow CORS
- Use a proxy server
- Make requests from the same origin

### My POST/PUT requests are being cached

POST/PUT/DELETE requests should not be cached. If this happens:
1. Disable caching: `enableCache: false`
2. Or clear cache after mutation: `fetcher.clearCache()`

### I'm getting "fetch is not defined" in Node.js

Install a fetch polyfill:

```bash
npm install node-fetch
```

```javascript
import fetch from 'node-fetch';
global.fetch = fetch;
```

Or use Node.js 18+ which has native fetch support.

## Performance Questions

### How can I optimize performance?

1. **Use shared cache** for multiple fetchers:
```javascript
const sharedCache = new DefaultCache({ maxSize: 100 });
const fetcher1 = new IbiraAPIFetcher(url1, { cache: sharedCache });
const fetcher2 = new IbiraAPIFetcher(url2, { cache: sharedCache });
```

2. **Increase cache size** for frequently accessed data
3. **Adjust cache TTL** based on data volatility
4. **Use IbiraAPIFetchManager** for parallel requests
5. **Disable caching** for real-time data

### What is the memory footprint?

- Each cache entry: ~1-2 KB (depends on response size)
- Default cache (50 entries): ~50-100 KB
- Observer array: Minimal (~1 KB)

Total footprint is typically < 200 KB for default configuration.

## Migration Questions

### I'm upgrading from v0.1.0, what changed?

v0.2.x is **100% backward compatible**. Main changes:
- Modular architecture (internal reorganization)
- New `IbiraAPIFetchManager` for multi-endpoint coordination
- Enhanced test coverage (40 → 152 tests)
- No breaking changes to public API

See [MIGRATION.md](../MIGRATION.md) for details.

### Can I use v0.1.0 and v0.2.0 code together?

Yes, all v0.1.0 code works unchanged in v0.2.x.

## Contributing

### How can I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Development setup
- Code standards
- Testing guidelines
- Pull request process

### I found a bug, where do I report it?

Open an issue on [GitHub](https://github.com/mpbarbosa/ibira.js/issues) with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js/browser version)

## Support

### Where can I get help?

1. Check this FAQ
2. Read the [API documentation](./IBIRA_API_FETCHER.md)
3. Review [examples](./EXAMPLES.md)
4. Check [troubleshooting guide](./TROUBLESHOOTING.md)
5. Open an issue on [GitHub](https://github.com/mpbarbosa/ibira.js/issues)

### Is there a community?

We're building a community! Connect via:
- GitHub Discussions (coming soon)
- Issue tracker for questions and feature requests

---

**Can't find your question?** Open an issue on [GitHub](https://github.com/mpbarbosa/ibira.js/issues) and we'll add it to this FAQ.
