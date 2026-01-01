# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using ibira.js.

## Quick Diagnostics Checklist

Before diving into specific issues, verify:

- [ ] ibira.js is properly installed (`npm list ibira.js`)
- [ ] You're importing from the correct path
- [ ] Your environment supports `fetch` API
- [ ] Network connectivity is working
- [ ] API endpoint is accessible
- [ ] Console shows any error messages

## Common Issues

### 1. Installation Issues

#### Issue: "Cannot find module 'ibira.js'"

**Symptoms:**
```
Error: Cannot find module 'ibira.js'
```

**Solutions:**

1. **Verify installation:**
   ```bash
   npm list ibira.js
   ```

2. **Reinstall the package:**
   ```bash
   npm uninstall ibira.js
   npm install ibira.js
   ```

3. **Check import path:**
   ```javascript
   // ✅ Correct
   import { IbiraAPIFetcher } from 'ibira.js';
   
   // ❌ Incorrect
   import { IbiraAPIFetcher } from './ibira.js';
   ```

4. **Clear npm cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

#### Issue: Version mismatch or outdated version

**Check current version:**
```bash
npm list ibira.js
```

**Update to latest:**
```bash
npm update ibira.js
```

**Install specific version:**
```bash
npm install ibira.js@0.2.1-alpha
```

### 2. Import/Export Issues

#### Issue: "fetch is not defined" (Node.js)

**Symptoms:**
```
ReferenceError: fetch is not defined
```

**Cause:** Node.js < 18 doesn't have native fetch support.

**Solutions:**

1. **Upgrade to Node.js 18+** (recommended):
   ```bash
   node --version  # Check current version
   # Upgrade to Node.js 18 or higher
   ```

2. **Install fetch polyfill:**
   ```bash
   npm install node-fetch
   ```
   
   ```javascript
   import fetch from 'node-fetch';
   global.fetch = fetch;
   
   import { IbiraAPIFetcher } from 'ibira.js';
   ```

3. **Use undici (Node.js 16+):**
   ```bash
   npm install undici
   ```
   
   ```javascript
   import { fetch } from 'undici';
   global.fetch = fetch;
   ```

#### Issue: "IbiraAPIFetcher is not a constructor"

**Symptoms:**
```
TypeError: IbiraAPIFetcher is not a constructor
```

**Cause:** Incorrect import syntax.

**Solution:**
```javascript
// ✅ Correct - Named import
import { IbiraAPIFetcher } from 'ibira.js';

// ❌ Incorrect - Default import
import IbiraAPIFetcher from 'ibira.js';
```

#### Issue: ESM vs CommonJS conflicts

**For ES Modules (recommended):**
```javascript
// package.json
{
  "type": "module"
}

// your-file.js
import { IbiraAPIFetcher } from 'ibira.js';
```

**For CommonJS:**
```javascript
// Use dynamic import
async function loadFetcher() {
  const { IbiraAPIFetcher } = await import('ibira.js');
  return IbiraAPIFetcher;
}
```

### 3. Network & CORS Issues

#### Issue: CORS errors in browser

**Symptoms:**
```
Access to fetch at 'https://api.example.com' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Important:** This is **NOT an ibira.js issue** - it's an API server configuration issue.

**Solutions:**

1. **Configure API server to allow CORS** (backend fix):
   ```javascript
   // Express.js example
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     next();
   });
   ```

2. **Use a proxy during development:**
   ```javascript
   // package.json (Create React App)
   {
     "proxy": "https://api.example.com"
   }
   ```

3. **Use CORS proxy service** (development only):
   ```javascript
   const url = 'https://cors-anywhere.herokuapp.com/https://api.example.com/data';
   const fetcher = IbiraAPIFetcher.withDefaultCache(url);
   ```

4. **Use server-side requests** (recommended for production):
   Make API calls from your backend instead of browser.

#### Issue: Network timeout errors

**Symptoms:**
```
AbortError: The operation was aborted
```

**Solutions:**

1. **Increase timeout:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache(),
     eventNotifier: new DefaultEventNotifier(),
     timeout: 60000  // 60 seconds
   });
   ```

2. **Check network connectivity:**
   ```bash
   curl -I https://api.example.com
   ```

3. **Verify API endpoint is responding:**
   ```bash
   curl https://api.example.com/your-endpoint
   ```

4. **Test with retries:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache(),
     eventNotifier: new DefaultEventNotifier(),
     maxRetries: 5,
     retryDelay: 2000
   });
   ```

#### Issue: Connection refused

**Symptoms:**
```
TypeError: fetch failed
cause: Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solutions:**

1. **Verify API server is running**
2. **Check URL is correct** (http vs https, port number)
3. **Check firewall settings**
4. **Test endpoint with curl:**
   ```bash
   curl http://localhost:3000/api/data
   ```

### 4. Caching Issues

#### Issue: Data not being cached

**Symptoms:** Every request hits the network, even with same URL.

**Solutions:**

1. **Verify caching is enabled:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache(),
     eventNotifier: new DefaultEventNotifier(),
     enableCache: true  // ✅ Ensure this is true
   });
   ```

2. **Check cache hasn't expired:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache({ 
       expiration: 600000  // 10 minutes
     }),
     eventNotifier: new DefaultEventNotifier()
   });
   ```

3. **Verify URL is identical:**
   ```javascript
   // ❌ These are different URLs (different cache keys)
   fetcher1 = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');
   fetcher2 = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users?v=1');
   
   // ✅ Same URL = same cache key
   const url = 'https://api.example.com/users';
   fetcher1 = IbiraAPIFetcher.withDefaultCache(url);
   fetcher2 = IbiraAPIFetcher.withDefaultCache(url);
   ```

4. **Check cache size limit:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache({ 
       maxSize: 100  // Increase if needed
     }),
     eventNotifier: new DefaultEventNotifier()
   });
   ```

#### Issue: Stale data being served

**Symptoms:** Cache returns old data when fresh data is expected.

**Solutions:**

1. **Clear cache manually:**
   ```javascript
   fetcher.clearCache();
   ```

2. **Reduce cache TTL:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache({ 
       expiration: 60000  // 1 minute
     }),
     eventNotifier: new DefaultEventNotifier()
   });
   ```

3. **Disable caching for real-time data:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache(),
     eventNotifier: new DefaultEventNotifier(),
     enableCache: false
   });
   ```

4. **Implement cache invalidation:**
   ```javascript
   // After POST/PUT/DELETE operations
   await fetcher.fetchData({ method: 'POST', body: data });
   fetcher.clearCache();  // Invalidate cache
   ```

#### Issue: POST/PUT requests being cached

**Symptoms:** Mutation requests return cached data.

**Solution:** Disable caching for mutations:
```javascript
const writeFetcher = new IbiraAPIFetcher(url, {
  cache: new DefaultCache(),
  eventNotifier: new DefaultEventNotifier(),
  enableCache: false,  // Disable for mutations
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### 5. Error Handling Issues

#### Issue: Errors not being caught

**Symptoms:** Unhandled promise rejections.

**Solution:** Always use try-catch:
```javascript
// ✅ Correct
try {
    const data = await fetcher.fetchData();
    console.log(data);
} catch (error) {
    console.error('Error:', error.message);
}

// ❌ Incorrect - unhandled rejection
const data = await fetcher.fetchData();
```

#### Issue: Need to distinguish error types

**Solution:** Check error properties:
```javascript
try {
    const data = await fetcher.fetchData();
} catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error - check connection');
    }
    
    // HTTP errors
    else if (error.message.includes('HTTP error! status:')) {
        const match = error.message.match(/status: (\d+)/);
        const status = match ? parseInt(match[1]) : 0;
        
        if (status === 401) {
            console.error('Unauthorized - refresh token');
        } else if (status === 404) {
            console.error('Not found');
        } else if (status >= 500) {
            console.error('Server error - retry later');
        }
    }
    
    // Timeout errors
    else if (error.name === 'AbortError') {
        console.error('Request timeout - try increasing timeout');
    }
    
    // Unknown errors
    else {
        console.error('Unknown error:', error);
    }
}
```

### 6. Performance Issues

#### Issue: Slow initial requests

**Symptoms:** First request takes long time.

**Solutions:**

1. **Increase timeout:**
   ```javascript
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache(),
     eventNotifier: new DefaultEventNotifier(),
     timeout: 60000
   });
   ```

2. **Check API server performance**
3. **Use connection pooling** (Node.js)
4. **Consider CDN or caching proxy**

#### Issue: High memory usage

**Symptoms:** Application memory grows over time.

**Solutions:**

1. **Reduce cache size:**
   ```javascript
   const cache = new DefaultCache({ 
     maxSize: 20,  // Lower limit
     expiration: 180000  // 3 minutes
   });
   ```

2. **Clear cache periodically:**
   ```javascript
   setInterval(() => {
     fetcher.clearCache();
   }, 600000);  // Every 10 minutes
   ```

3. **Use shared cache for multiple fetchers:**
   ```javascript
   const sharedCache = new DefaultCache({ maxSize: 50 });
   const fetcher1 = new IbiraAPIFetcher(url1, { cache: sharedCache });
   const fetcher2 = new IbiraAPIFetcher(url2, { cache: sharedCache });
   ```

#### Issue: Too many parallel requests

**Use IbiraAPIFetchManager:**
```javascript
import { IbiraAPIFetchManager } from 'ibira.js';

const manager = new IbiraAPIFetchManager();
manager.addFetcher('users', 'https://api.example.com/users');
manager.addFetcher('posts', 'https://api.example.com/posts');

// Fetches in parallel but managed
const results = await manager.fetchAll();
```

### 7. Observer Pattern Issues

#### Issue: Observers not receiving events

**Symptoms:** `update()` method never called.

**Solutions:**

1. **Verify observer is subscribed:**
   ```javascript
   const observer = {
     update(event, data) {
       console.log(event, data);
     }
   };
   
   eventNotifier.subscribe(observer);  // ✅ Don't forget this
   ```

2. **Check observer has update method:**
   ```javascript
   // ✅ Correct
   const observer = {
     update(event, data) {
       console.log(event, data);
     }
   };
   
   // ❌ Incorrect - typo in method name
   const observer = {
     updated(event, data) {
       console.log(event, data);
     }
   };
   ```

3. **Ensure eventNotifier is passed to fetcher:**
   ```javascript
   const eventNotifier = new DefaultEventNotifier();
   eventNotifier.subscribe(observer);
   
   // ✅ Pass eventNotifier to fetcher
   const fetcher = new IbiraAPIFetcher(url, {
     cache: new DefaultCache(),
     eventNotifier: eventNotifier
   });
   ```

#### Issue: Memory leak from observers

**Solution:** Always unsubscribe when done:
```javascript
// Subscribe
eventNotifier.subscribe(observer);

// When component unmounts or is no longer needed
eventNotifier.unsubscribe(observer);

// Or clear all observers
eventNotifier.clear();
```

### 8. Configuration Issues

#### Issue: Configuration not being applied

**Common mistakes:**

```javascript
// ❌ Incorrect - passing config to wrong method
const fetcher = IbiraAPIFetcher.withDefaultCache(url, {
  maxRetries: 5  // This is ignored
});

// ✅ Correct - use full constructor
const fetcher = new IbiraAPIFetcher(url, {
  cache: new DefaultCache(),
  eventNotifier: new DefaultEventNotifier(),
  maxRetries: 5
});
```

#### Issue: Headers not being sent

**Solution:** Ensure headers are properly formatted:
```javascript
// ✅ Correct
const fetcher = new IbiraAPIFetcher(url, {
  cache: new DefaultCache(),
  eventNotifier: new DefaultEventNotifier(),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  }
});

// ❌ Incorrect - headers should be object, not Headers instance
const headers = new Headers();
headers.append('Content-Type', 'application/json');
const fetcher = new IbiraAPIFetcher(url, {
  cache: new DefaultCache(),
  eventNotifier: new DefaultEventNotifier(),
  headers: headers  // May not work as expected
});
```

## Debugging Tips

### Enable Detailed Logging

Use observers to track all events:

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

const eventNotifier = new DefaultEventNotifier();

// Debug observer
const debugObserver = {
  update(event, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] EVENT:`, event, data);
  }
};

eventNotifier.subscribe(debugObserver);

const fetcher = new IbiraAPIFetcher(url, {
  cache: new DefaultCache(),
  eventNotifier
});
```

### Check Cache State

```javascript
const cache = new DefaultCache();
const fetcher = new IbiraAPIFetcher(url, { 
  cache,
  eventNotifier: new DefaultEventNotifier()
});

await fetcher.fetchData();

// Inspect cache
console.log('Cache size:', cache.size);
console.log('Cache entries:', Array.from(cache.entries()));
```

### Test API Endpoint Directly

```bash
# Test with curl
curl -v https://api.example.com/endpoint

# Test with specific headers
curl -H "Authorization: Bearer token" https://api.example.com/endpoint

# Test POST request
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"value"}' \
  https://api.example.com/endpoint
```

### Browser DevTools Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make request with ibira.js
4. Check request headers, response, timing

### Node.js Debugging

```javascript
// Add this at the top of your file
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Enable fetch debugging (with node-fetch)
process.env.NODE_DEBUG = 'fetch';
```

## Still Having Issues?

1. **Check the FAQ:** [docs/FAQ.md](./FAQ.md)
2. **Review examples:** [docs/EXAMPLES.md](./EXAMPLES.md)
3. **Read API docs:** [docs/IBIRA_API_FETCHER.md](./IBIRA_API_FETCHER.md)
4. **Search issues:** [GitHub Issues](https://github.com/mpbarbosa/ibira.js/issues)
5. **Open a new issue:** [Create Issue](https://github.com/mpbarbosa/ibira.js/issues/new)

When opening an issue, include:
- ibira.js version (`npm list ibira.js`)
- Node.js/browser version
- Operating system
- Minimal code to reproduce
- Error messages and stack traces
- What you've already tried

---

**ibira.js v0.2.1-alpha** | [Documentation](./INDEX.md) | [API Reference](./IBIRA_API_FETCHER.md)
