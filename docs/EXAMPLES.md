# Real-World Examples

This document provides practical, copy-paste examples for common use cases with ibira.js.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Authentication Examples](#authentication-examples)
3. [Error Handling Examples](#error-handling-examples)
4. [Caching Strategies](#caching-strategies)
5. [Multi-Endpoint Coordination](#multi-endpoint-coordination)
6. [React Integration](#react-integration)
7. [Node.js Backend Examples](#nodejs-backend-examples)
8. [Advanced Patterns](#advanced-patterns)

## Basic Examples

### Simple GET Request

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.github.com/users/octocat');

try {
    const user = await fetcher.fetchData();
    console.log(`User: ${user.name} (${user.login})`);
    // Output: User: The Octocat (octocat)
    
    console.log(`Followers: ${user.followers}`);
    // Output: Followers: 9543
} catch (error) {
    console.error('Failed to fetch user:', error.message);
    // Output: Failed to fetch user: HTTP error! status: 404
}
```

### POST Request with JSON Body

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'developer'
    }),
    enableCache: false  // Don't cache POST requests
});

try {
    const newUser = await fetcher.fetchData();
    console.log('Created user:', newUser);
    // Output: Created user: { id: 123, name: 'John Doe', email: 'john@example.com', role: 'developer' }
} catch (error) {
    console.error('Failed to create user:', error.message);
    // Output: Failed to create user: HTTP error! status: 400
}
```

### PUT Request (Update Resource)

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

async function updateUser(userId, updates) {
    const fetcher = IbiraAPIFetcher.withDefaultCache(
        `https://api.example.com/users/${userId}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates),
            enableCache: false
        }
    );
    
    try {
        const updatedUser = await fetcher.fetchData();
        console.log('User updated:', updatedUser);
        return updatedUser;
    } catch (error) {
        console.error('Update failed:', error.message);
        throw error;
    }
}

// Usage
await updateUser(123, { name: 'Jane Doe', email: 'jane@example.com' });
```

### DELETE Request

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

async function deleteUser(userId) {
    const fetcher = IbiraAPIFetcher.withDefaultCache(
        `https://api.example.com/users/${userId}`,
        {
            method: 'DELETE',
            enableCache: false
        }
    );
    
    try {
        await fetcher.fetchData();
        console.log(`User ${userId} deleted successfully`);
        return true;
    } catch (error) {
        console.error('Delete failed:', error.message);
        return false;
    }
}

// Usage
const success = await deleteUser(123);
```

## Authentication Examples

### Bearer Token Authentication

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const token = 'your-jwt-token-here';

const fetcher = IbiraAPIFetcher.withDefaultCache(
    'https://api.example.com/protected-resource',
    {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }
);

try {
    const data = await fetcher.fetchData();
    console.log('Protected data:', data);
} catch (error) {
    if (error.message.includes('status: 401')) {
        console.error('Token expired or invalid - please login again');
    } else {
        console.error('Request failed:', error.message);
    }
}
```

### API Key Authentication

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const API_KEY = 'your-api-key-here';

const fetcher = IbiraAPIFetcher.withDefaultCache(
    'https://api.example.com/data',
    {
        headers: {
            'X-API-Key': API_KEY
        }
    }
);

const data = await fetcher.fetchData();
```

### Basic Authentication

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const username = 'user';
const password = 'pass';
const credentials = btoa(`${username}:${password}`);

const fetcher = IbiraAPIFetcher.withDefaultCache(
    'https://api.example.com/data',
    {
        headers: {
            'Authorization': `Basic ${credentials}`
        }
    }
);

const data = await fetcher.fetchData();
```

### Automatic Token Refresh

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

class AuthenticatedAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.accessToken = null;
        this.refreshToken = localStorage.getItem('refreshToken');
    }
    
    async getAccessToken() {
        if (this.accessToken) {
            return this.accessToken;
        }
        
        // Refresh token
        const refreshFetcher = IbiraAPIFetcher.withDefaultCache(
            `${this.baseUrl}/auth/refresh`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
                enableCache: false
            }
        );
        
        const result = await refreshFetcher.fetchData();
        this.accessToken = result.accessToken;
        return this.accessToken;
    }
    
    async fetch(endpoint) {
        try {
            const token = await this.getAccessToken();
            const fetcher = IbiraAPIFetcher.withDefaultCache(
                `${this.baseUrl}${endpoint}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return await fetcher.fetchData();
        } catch (error) {
            if (error.message.includes('status: 401')) {
                // Token expired, clear and retry
                this.accessToken = null;
                return this.fetch(endpoint);
            }
            throw error;
        }
    }
}

// Usage
const api = new AuthenticatedAPI('https://api.example.com');
const data = await api.fetch('/users');
```

## Error Handling Examples

### Comprehensive Error Handler

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

async function fetchWithErrorHandling(url) {
    const fetcher = IbiraAPIFetcher.withDefaultCache(url);
    
    try {
        const data = await fetcher.fetchData();
        return { success: true, data };
    } catch (error) {
        // Network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                success: false,
                error: 'network_error',
                message: 'Network connection failed. Please check your internet connection.',
                retryable: true
            };
        }
        
        // Timeout errors
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'timeout',
                message: 'Request timed out. Please try again.',
                retryable: true
            };
        }
        
        // HTTP errors
        if (error.message.includes('HTTP error! status:')) {
            const statusMatch = error.message.match(/status: (\d+)/);
            const status = statusMatch ? parseInt(statusMatch[1]) : 0;
            
            switch (status) {
                case 400:
                    return {
                        success: false,
                        error: 'bad_request',
                        message: 'Invalid request. Please check your input.',
                        retryable: false
                    };
                case 401:
                    return {
                        success: false,
                        error: 'unauthorized',
                        message: 'Authentication required. Please log in.',
                        retryable: false
                    };
                case 403:
                    return {
                        success: false,
                        error: 'forbidden',
                        message: 'You do not have permission to access this resource.',
                        retryable: false
                    };
                case 404:
                    return {
                        success: false,
                        error: 'not_found',
                        message: 'The requested resource was not found.',
                        retryable: false
                    };
                case 429:
                    return {
                        success: false,
                        error: 'rate_limited',
                        message: 'Too many requests. Please wait and try again.',
                        retryable: true
                    };
                case 500:
                case 502:
                case 503:
                case 504:
                    return {
                        success: false,
                        error: 'server_error',
                        message: 'Server error. Please try again later.',
                        retryable: true
                    };
                default:
                    return {
                        success: false,
                        error: 'http_error',
                        message: `HTTP error ${status}`,
                        retryable: true
                    };
            }
        }
        
        // Unknown errors
        return {
            success: false,
            error: 'unknown',
            message: 'An unexpected error occurred.',
            retryable: false
        };
    }
}

// Usage
const result = await fetchWithErrorHandling('https://api.example.com/data');

if (result.success) {
    console.log('Data:', result.data);
} else {
    console.error(`Error (${result.error}):`, result.message);
    
    if (result.retryable) {
        console.log('This error is retryable. You may want to try again.');
    }
}
```

### Retry with Exponential Backoff

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

async function fetchWithRetry(url, maxAttempts = 5) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const fetcher = IbiraAPIFetcher.withDefaultCache(url);
            const data = await fetcher.fetchData();
            
            if (attempt > 1) {
                console.log(`✅ Success on attempt ${attempt}`);
            }
            
            return data;
        } catch (error) {
            lastError = error;
            
            // Don't retry on client errors (4xx)
            if (error.message.includes('status: 4')) {
                throw error;
            }
            
            if (attempt < maxAttempts) {
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`❌ Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

// Usage
try {
    const data = await fetchWithRetry('https://api.example.com/data');
    console.log('Data:', data);
} catch (error) {
    console.error('All retry attempts failed:', error.message);
}
```

## Caching Strategies

### Short-lived Cache for Real-time Data

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

// 30-second cache for real-time stock prices
const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/stock-prices',
    {
        cache: new DefaultCache({ 
            expiration: 30000,  // 30 seconds
            maxSize: 100
        }),
        eventNotifier: new DefaultEventNotifier()
    }
);

const prices = await fetcher.fetchData();
```

### Long-lived Cache for Static Data

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

// 1-hour cache for country/city data
const fetcher = new IbiraAPIFetcher(
    'https://api.example.com/countries',
    {
        cache: new DefaultCache({ 
            expiration: 3600000,  // 1 hour
            maxSize: 50
        }),
        eventNotifier: new DefaultEventNotifier()
    }
);

const countries = await fetcher.fetchData();
```

### Manual Cache Invalidation

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

const userFetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');

// Fetch users (will be cached)
const users = await userFetcher.fetchData();

// After creating/updating a user, invalidate cache
await createUser({ name: 'New User' });
userFetcher.clearCache();

// Next fetch will get fresh data
const updatedUsers = await userFetcher.fetchData();
```

### Conditional Caching Based on Response

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

async function fetchWithConditionalCaching(url) {
    const cache = new DefaultCache();
    const fetcher = new IbiraAPIFetcher(url, {
        cache,
        eventNotifier: new DefaultEventNotifier()
    });
    
    try {
        const data = await fetcher.fetchData();
        
        // If data indicates it's temporary, clear cache immediately
        if (data.temporary === true) {
            cache.clear();
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}
```

## Multi-Endpoint Coordination

### Parallel Requests with IbiraAPIFetchManager

```javascript
import { IbiraAPIFetchManager, DefaultCache } from 'ibira.js';

// Create manager with shared cache
const manager = new IbiraAPIFetchManager({ 
    cache: new DefaultCache({ maxSize: 100 }) 
});

// Add multiple endpoints
manager.addFetcher('users', 'https://api.example.com/users');
manager.addFetcher('posts', 'https://api.example.com/posts');
manager.addFetcher('comments', 'https://api.example.com/comments');

// Fetch all in parallel
const results = await manager.fetchAll();

console.log('Users:', results.users);
console.log('Posts:', results.posts);
console.log('Comments:', results.comments);
```

### Sequential Dependent Requests

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

async function fetchUserWithPosts(userId) {
    // Step 1: Fetch user
    const userFetcher = IbiraAPIFetcher.withDefaultCache(
        `https://api.example.com/users/${userId}`
    );
    const user = await userFetcher.fetchData();
    
    // Step 2: Fetch user's posts (depends on user data)
    const postsFetcher = IbiraAPIFetcher.withDefaultCache(
        `https://api.example.com/users/${user.id}/posts`
    );
    const posts = await postsFetcher.fetchData();
    
    return {
        user,
        posts
    };
}

// Usage
const data = await fetchUserWithPosts(123);
console.log(`${data.user.name} has ${data.posts.length} posts`);
```

### Aggregating Multiple API Responses

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

async function getDashboardData() {
    const endpoints = [
        'https://api.example.com/users/me',
        'https://api.example.com/notifications',
        'https://api.example.com/activity',
        'https://api.example.com/settings'
    ];
    
    // Create fetchers for all endpoints
    const fetchers = endpoints.map(url => 
        IbiraAPIFetcher.withDefaultCache(url)
    );
    
    // Fetch all in parallel
    const results = await Promise.allSettled(
        fetchers.map(f => f.fetchData())
    );
    
    // Process results
    return {
        profile: results[0].status === 'fulfilled' ? results[0].value : null,
        notifications: results[1].status === 'fulfilled' ? results[1].value : [],
        activity: results[2].status === 'fulfilled' ? results[2].value : [],
        settings: results[3].status === 'fulfilled' ? results[3].value : {}
    };
}

// Usage
const dashboard = await getDashboardData();
console.log('Dashboard loaded:', dashboard);
```

## React Integration

### Basic React Hook

```javascript
import { useState, useEffect } from 'react';
import { IbiraAPIFetcher } from 'ibira.js';

function useAPI(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetcher = IbiraAPIFetcher.withDefaultCache(url);
        
        fetcher.fetchData()
            .then(result => {
                setData(result);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [url]);
    
    return { data, loading, error };
}

// Usage in component
function UserList() {
    const { data: users, loading, error } = useAPI('https://api.example.com/users');
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <ul>
            {users.map(user => (
                <li key={user.id}>{user.name}</li>
            ))}
        </ul>
    );
}
```

### React Hook with Refresh

```javascript
import { useState, useEffect, useCallback } from 'react';
import { IbiraAPIFetcher } from 'ibira.js';

function useAPIWithRefresh(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fetcher] = useState(() => IbiraAPIFetcher.withDefaultCache(url));
    
    const fetchData = useCallback(async (forceFresh = false) => {
        setLoading(true);
        setError(null);
        
        try {
            if (forceFresh) {
                fetcher.clearCache();
            }
            
            const result = await fetcher.fetchData();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [fetcher]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    return { data, loading, error, refresh: () => fetchData(true) };
}

// Usage in component
function UserList() {
    const { data: users, loading, error, refresh } = useAPIWithRefresh(
        'https://api.example.com/users'
    );
    
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <div>
            <button onClick={refresh}>Refresh</button>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

### React Context for Global API State

```javascript
import { createContext, useContext, useState } from 'react';
import { IbiraAPIFetchManager, DefaultCache } from 'ibira.js';

const APIContext = createContext(null);

export function APIProvider({ children }) {
    const [manager] = useState(() => {
        const m = new IbiraAPIFetchManager({ 
            cache: new DefaultCache({ maxSize: 100 }) 
        });
        
        m.addFetcher('users', 'https://api.example.com/users');
        m.addFetcher('posts', 'https://api.example.com/posts');
        
        return m;
    });
    
    return (
        <APIContext.Provider value={manager}>
            {children}
        </APIContext.Provider>
    );
}

export function useAPIManager() {
    const manager = useContext(APIContext);
    if (!manager) {
        throw new Error('useAPIManager must be used within APIProvider');
    }
    return manager;
}

// Usage in components
function App() {
    return (
        <APIProvider>
            <Dashboard />
        </APIProvider>
    );
}

function Dashboard() {
    const manager = useAPIManager();
    const [data, setData] = useState(null);
    
    useEffect(() => {
        manager.fetchAll().then(setData);
    }, [manager]);
    
    if (!data) return <div>Loading...</div>;
    
    return (
        <div>
            <h2>Users: {data.users.length}</h2>
            <h2>Posts: {data.posts.length}</h2>
        </div>
    );
}
```

## Node.js Backend Examples

### Express.js API Proxy

```javascript
import express from 'express';
import { IbiraAPIFetcher } from 'ibira.js';

const app = express();

// Proxy endpoint
app.get('/api/users', async (req, res) => {
    try {
        const fetcher = IbiraAPIFetcher.withDefaultCache(
            'https://external-api.example.com/users'
        );
        
        const users = await fetcher.fetchData();
        res.json(users);
    } catch (error) {
        console.error('API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

### Server-Side Caching with Redis-like Pattern

```javascript
import { IbiraAPIFetcher, DefaultCache, DefaultEventNotifier } from 'ibira.js';

// Global cache shared across requests
const globalCache = new DefaultCache({ 
    maxSize: 500,
    expiration: 600000  // 10 minutes
});

async function fetchExternalAPI(endpoint) {
    const fetcher = new IbiraAPIFetcher(
        `https://external-api.example.com${endpoint}`,
        {
            cache: globalCache,
            eventNotifier: new DefaultEventNotifier()
        }
    );
    
    return fetcher.fetchData();
}

// Express route
app.get('/api/*', async (req, res) => {
    try {
        const data = await fetchExternalAPI(req.path);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Advanced Patterns

### Circuit Breaker Pattern

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }
    
    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    
    onFailure() {
        this.failureCount++;
        
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
            console.log('Circuit breaker opened');
        }
    }
}

// Usage
const breaker = new CircuitBreaker();
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');

try {
    const data = await breaker.execute(() => fetcher.fetchData());
    console.log('Data:', data);
} catch (error) {
    console.error('Request failed:', error.message);
}
```

### Rate Limiting

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }
    
    async execute(fn) {
        const now = Date.now();
        
        // Remove old requests outside window
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.windowMs - (now - oldestRequest);
            
            console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            return this.execute(fn);
        }
        
        this.requests.push(now);
        return fn();
    }
}

// Usage: 5 requests per minute
const limiter = new RateLimiter(5, 60000);
const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');

const data = await limiter.execute(() => fetcher.fetchData());
```

### Polling with Automatic Stop

```javascript
import { IbiraAPIFetcher } from 'ibira.js';

class Poller {
    constructor(url, interval = 5000) {
        this.url = url;
        this.interval = interval;
        this.polling = false;
        this.timer = null;
        this.fetcher = IbiraAPIFetcher.withDefaultCache(url, {
            enableCache: false  // Always get fresh data
        });
    }
    
    start(callback) {
        if (this.polling) return;
        
        this.polling = true;
        
        const poll = async () => {
            if (!this.polling) return;
            
            try {
                const data = await this.fetcher.fetchData();
                callback(null, data);
            } catch (error) {
                callback(error, null);
            }
            
            if (this.polling) {
                this.timer = setTimeout(poll, this.interval);
            }
        };
        
        poll();
    }
    
    stop() {
        this.polling = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

// Usage
const poller = new Poller('https://api.example.com/status', 5000);

poller.start((error, data) => {
    if (error) {
        console.error('Poll failed:', error.message);
        return;
    }
    
    console.log('Status:', data.status);
    
    // Stop polling when condition is met
    if (data.status === 'complete') {
        poller.stop();
        console.log('Polling stopped - task complete');
    }
});

// Stop after 1 minute regardless
setTimeout(() => poller.stop(), 60000);
```

---

**ibira.js v0.2.1-alpha** | [Documentation](./INDEX.md) | [API Reference](./IBIRA_API_FETCHER.md) | [FAQ](./FAQ.md)
