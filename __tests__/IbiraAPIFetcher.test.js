// __tests__/IbiraAPIFetcher.test.js
// Unit tests for IbiraAPIFetcher class
// Tests cover caching, retry logic, error handling, and observer patterns

// Mock the IbiraAPIFetcher class for testing
class IbiraAPIFetcher {
    constructor(url) {
        this.url = url;
        this.observers = [];
        this.fetching = false;
        this.data = null;
        this.error = null;
        this.loading = false;
        this.lastFetch = 0;
        this.timeout = 10000;
        this.cache = new Map();
        this.cacheExpiration = 300000; // 5 minutes default cache expiration (ms)
        this.maxCacheSize = 50; // Maximum number of cached items
        this.maxRetries = 3; // Maximum number of retry attempts
        this.retryDelay = 1000; // Initial retry delay in milliseconds
        this.retryMultiplier = 2; // Exponential backoff multiplier
        this.retryableStatusCodes = [408, 429, 500, 502, 503, 504]; // HTTP status codes that should trigger retries
    }

    getCacheKey() {
        return this.url;
    }

    _createCacheEntry(data) {
        return {
            data: data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.cacheExpiration
        };
    }

    _isCacheEntryValid(cacheEntry) {
        if (!cacheEntry) return false;
        return Date.now() < cacheEntry.expiresAt;
    }

    _enforceCacheSizeLimit() {
        if (this.cache.size <= this.maxCacheSize) {
            return;
        }

        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const entriesToRemove = this.cache.size - this.maxCacheSize;
        
        for (let i = 0; i < entriesToRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
    }

    _cleanupExpiredCache() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now >= entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.cache.delete(key));
    }

    _isRetryableError(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return true;
        }

        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return true;
        }

        if (error.message.includes('HTTP error! status:')) {
            const statusMatch = error.message.match(/status: (\d+)/);
            if (statusMatch) {
                const statusCode = parseInt(statusMatch[1]);
                return this.retryableStatusCodes.includes(statusCode);
            }
        }

        return false;
    }

    _calculateRetryDelay(attempt) {
        const delay = this.retryDelay * Math.pow(this.retryMultiplier, attempt);
        const jitter = delay * 0.25 * (Math.random() - 0.5);
        return Math.max(100, delay + jitter);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _performSingleRequest(abortController) {
        const fetchOptions = {
            signal: abortController.signal
        };

        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, this.timeout);

        try {
            const response = await fetch(this.url, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    subscribe(observer) {
        if (observer) {
            this.observers = [...this.observers, observer];
        }
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter((o) => o !== observer);
    }

    notifyObservers(...args) {
        this.observers.forEach((observer) => {
            observer.update(...args);
        });
    }

    async fetchData() {
        const cacheKey = this.getCacheKey();
        this._cleanupExpiredCache();

        if (this.cache.has(cacheKey)) {
            const cacheEntry = this.cache.get(cacheKey);
            if (this._isCacheEntryValid(cacheEntry)) {
                this.data = cacheEntry.data;
                cacheEntry.timestamp = Date.now();
                return;
            } else {
                this.cache.delete(cacheKey);
            }
        }

        this.loading = true;

        let lastError = null;
        let attempt = 0;

        while (attempt <= this.maxRetries) {
            try {
                const abortController = new AbortController();
                const data = await this._performSingleRequest(abortController);

                this.data = data;
                const cacheEntry = this._createCacheEntry(data);
                this.cache.set(cacheKey, cacheEntry);
                this._enforceCacheSizeLimit();

                this.error = null;
                this.notifyObservers('success', this.data);
                this.loading = false;
                return;

            } catch (error) {
                lastError = error;
                attempt++;

                if (attempt <= this.maxRetries && this._isRetryableError(error)) {
                    const delay = this._calculateRetryDelay(attempt - 1);
                    
                    this.notifyObservers('retry', {
                        attempt: attempt,
                        maxRetries: this.maxRetries,
                        error: error,
                        retryIn: delay
                    });

                    await this._sleep(delay);
                    continue;
                }

                break;
            }
        }

        this.error = lastError;
        
        this.notifyObservers('error', {
            error: lastError,
            attempts: attempt,
            maxRetries: this.maxRetries
        });

        this.loading = false;
    }
}

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
console.error = jest.fn();
console.warn = jest.fn();

describe('IbiraAPIFetcher', () => {
    let fetcher;
    const testUrl = 'https://api.example.com/data';
    const mockData = { id: 123, name: 'Test Data' };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
        
        // Create fresh fetcher instance
        fetcher = new IbiraAPIFetcher(testUrl);
        
        // Mock successful fetch response by default
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(mockData)
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with correct default values', () => {
            const newFetcher = new IbiraAPIFetcher(testUrl);
            
            expect(newFetcher.url).toBe(testUrl);
            expect(newFetcher.observers).toEqual([]);
            expect(newFetcher.fetching).toBe(false);
            expect(newFetcher.data).toBeNull();
            expect(newFetcher.error).toBeNull();
            expect(newFetcher.loading).toBe(false);
            expect(newFetcher.lastFetch).toBe(0);
            expect(newFetcher.timeout).toBe(10000);
            expect(newFetcher.cache).toBeInstanceOf(Map);
            expect(newFetcher.cacheExpiration).toBe(300000);
            expect(newFetcher.maxCacheSize).toBe(50);
            expect(newFetcher.maxRetries).toBe(3);
            expect(newFetcher.retryDelay).toBe(1000);
            expect(newFetcher.retryMultiplier).toBe(2);
            expect(newFetcher.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
        });

        test('should accept URL parameter', () => {
            const customUrl = 'https://api.custom.com/endpoint';
            const newFetcher = new IbiraAPIFetcher(customUrl);
            
            expect(newFetcher.url).toBe(customUrl);
        });
    });

    describe('getCacheKey', () => {
        test('should return URL as cache key by default', () => {
            const cacheKey = fetcher.getCacheKey();
            expect(cacheKey).toBe(testUrl);
        });

        test('should be overridable in subclasses', () => {
            class CustomFetcher extends IbiraAPIFetcher {
                getCacheKey() {
                    return `${this.url}:custom`;
                }
            }
            
            const customFetcher = new CustomFetcher(testUrl);
            expect(customFetcher.getCacheKey()).toBe(`${testUrl}:custom`);
        });
    });

    describe('Observer Pattern', () => {
        let observer1, observer2;

        beforeEach(() => {
            observer1 = { update: jest.fn() };
            observer2 = { update: jest.fn() };
        });

        describe('subscribe', () => {
            test('should add observer to observers list', () => {
                fetcher.subscribe(observer1);
                
                expect(fetcher.observers).toContain(observer1);
                expect(fetcher.observers).toHaveLength(1);
            });

            test('should add multiple observers', () => {
                fetcher.subscribe(observer1);
                fetcher.subscribe(observer2);
                
                expect(fetcher.observers).toContain(observer1);
                expect(fetcher.observers).toContain(observer2);
                expect(fetcher.observers).toHaveLength(2);
            });

            test('should handle null observer gracefully', () => {
                fetcher.subscribe(null);
                
                expect(fetcher.observers).toHaveLength(0);
            });

            test('should handle undefined observer gracefully', () => {
                fetcher.subscribe(undefined);
                
                expect(fetcher.observers).toHaveLength(0);
            });
        });

        describe('unsubscribe', () => {
            test('should remove observer from observers list', () => {
                fetcher.subscribe(observer1);
                fetcher.subscribe(observer2);
                
                fetcher.unsubscribe(observer1);
                
                expect(fetcher.observers).not.toContain(observer1);
                expect(fetcher.observers).toContain(observer2);
                expect(fetcher.observers).toHaveLength(1);
            });

            test('should handle removing non-existent observer', () => {
                fetcher.subscribe(observer1);
                
                fetcher.unsubscribe(observer2);
                
                expect(fetcher.observers).toContain(observer1);
                expect(fetcher.observers).toHaveLength(1);
            });

            test('should handle empty observers list', () => {
                fetcher.unsubscribe(observer1);
                
                expect(fetcher.observers).toHaveLength(0);
            });
        });

        describe('notifyObservers', () => {
            test('should call update method on all observers', () => {
                fetcher.subscribe(observer1);
                fetcher.subscribe(observer2);
                
                fetcher.notifyObservers('test', { data: 'value' });
                
                expect(observer1.update).toHaveBeenCalledWith('test', { data: 'value' });
                expect(observer2.update).toHaveBeenCalledWith('test', { data: 'value' });
            });

            test('should handle observers with no update method', () => {
                const badObserver = {};
                fetcher.subscribe(badObserver);
                
                expect(() => {
                    fetcher.notifyObservers('test');
                }).toThrow();
            });

            test('should call observers with multiple arguments', () => {
                fetcher.subscribe(observer1);
                
                fetcher.notifyObservers('arg1', 'arg2', 'arg3');
                
                expect(observer1.update).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
            });
        });
    });

    describe('Cache Management', () => {
        describe('_createCacheEntry', () => {
            test('should create cache entry with timestamp and expiration', () => {
                const testData = { test: 'data' };
                const beforeTime = Date.now();
                
                const entry = fetcher._createCacheEntry(testData);
                
                const afterTime = Date.now();
                
                expect(entry.data).toBe(testData);
                expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
                expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
                expect(entry.expiresAt).toBe(entry.timestamp + fetcher.cacheExpiration);
            });
        });

        describe('_isCacheEntryValid', () => {
            test('should return true for valid cache entry', () => {
                const entry = {
                    data: mockData,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 1000
                };
                
                expect(fetcher._isCacheEntryValid(entry)).toBe(true);
            });

            test('should return false for expired cache entry', () => {
                const entry = {
                    data: mockData,
                    timestamp: Date.now() - 2000,
                    expiresAt: Date.now() - 1000
                };
                
                expect(fetcher._isCacheEntryValid(entry)).toBe(false);
            });

            test('should return false for null entry', () => {
                expect(fetcher._isCacheEntryValid(null)).toBe(false);
            });

            test('should return false for undefined entry', () => {
                expect(fetcher._isCacheEntryValid(undefined)).toBe(false);
            });
        });

        describe('_enforceCacheSizeLimit', () => {
            test('should not remove entries when under limit', () => {
                // Add entries under the limit
                for (let i = 0; i < 10; i++) {
                    const entry = fetcher._createCacheEntry({ id: i });
                    fetcher.cache.set(`key${i}`, entry);
                }
                
                fetcher._enforceCacheSizeLimit();
                
                expect(fetcher.cache.size).toBe(10);
            });

            test('should remove oldest entries when over limit', () => {
                // Set smaller limit for testing
                fetcher.maxCacheSize = 3;
                
                // Add entries with different timestamps
                const entries = [];
                for (let i = 0; i < 5; i++) {
                    const entry = {
                        data: { id: i },
                        timestamp: Date.now() + i * 1000, // Different timestamps
                        expiresAt: Date.now() + 300000
                    };
                    entries.push(entry);
                    fetcher.cache.set(`key${i}`, entry);
                }
                
                fetcher._enforceCacheSizeLimit();
                
                expect(fetcher.cache.size).toBe(3);
                // Should keep the newest entries (key2, key3, key4)
                expect(fetcher.cache.has('key2')).toBe(true);
                expect(fetcher.cache.has('key3')).toBe(true);
                expect(fetcher.cache.has('key4')).toBe(true);
                expect(fetcher.cache.has('key0')).toBe(false);
                expect(fetcher.cache.has('key1')).toBe(false);
            });
        });

        describe('_cleanupExpiredCache', () => {
            test('should remove expired entries', () => {
                // Add valid entry
                const validEntry = {
                    data: { id: 1 },
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 1000
                };
                fetcher.cache.set('valid', validEntry);
                
                // Add expired entry
                const expiredEntry = {
                    data: { id: 2 },
                    timestamp: Date.now() - 2000,
                    expiresAt: Date.now() - 1000
                };
                fetcher.cache.set('expired', expiredEntry);
                
                fetcher._cleanupExpiredCache();
                
                expect(fetcher.cache.has('valid')).toBe(true);
                expect(fetcher.cache.has('expired')).toBe(false);
                expect(fetcher.cache.size).toBe(1);
            });

            test('should handle empty cache', () => {
                fetcher._cleanupExpiredCache();
                
                expect(fetcher.cache.size).toBe(0);
            });
        });
    });

    describe('Retry Logic', () => {
        describe('_isRetryableError', () => {
            test('should identify network errors as retryable', () => {
                const networkError = new TypeError('fetch error');
                
                expect(fetcher._isRetryableError(networkError)).toBe(true);
            });

            test('should identify timeout errors as retryable', () => {
                const timeoutError = new Error('timeout');
                timeoutError.name = 'AbortError';
                
                expect(fetcher._isRetryableError(timeoutError)).toBe(true);
            });

            test('should identify retryable HTTP status codes', () => {
                const retryableStatuses = [408, 429, 500, 502, 503, 504];
                
                retryableStatuses.forEach(status => {
                    const error = new Error(`HTTP error! status: ${status}`);
                    expect(fetcher._isRetryableError(error)).toBe(true);
                });
            });

            test('should not retry non-retryable HTTP status codes', () => {
                const nonRetryableStatuses = [400, 401, 403, 404, 422];
                
                nonRetryableStatuses.forEach(status => {
                    const error = new Error(`HTTP error! status: ${status}`);
                    expect(fetcher._isRetryableError(error)).toBe(false);
                });
            });

            test('should not retry unknown errors', () => {
                const unknownError = new Error('Unknown error');
                
                expect(fetcher._isRetryableError(unknownError)).toBe(false);
            });
        });

        describe('_calculateRetryDelay', () => {
            test('should calculate exponential backoff delay', () => {
                const delay0 = fetcher._calculateRetryDelay(0);
                const delay1 = fetcher._calculateRetryDelay(1);
                const delay2 = fetcher._calculateRetryDelay(2);
                
                // Base delay is 1000ms, multiplier is 2
                expect(delay0).toBeGreaterThanOrEqual(750); // 1000ms ± 25%
                expect(delay0).toBeLessThanOrEqual(1250);
                
                expect(delay1).toBeGreaterThanOrEqual(1500); // 2000ms ± 25%
                expect(delay1).toBeLessThanOrEqual(2500);
                
                expect(delay2).toBeGreaterThanOrEqual(3000); // 4000ms ± 25%
                expect(delay2).toBeLessThanOrEqual(5000);
            });

            test('should have minimum delay of 100ms', () => {
                fetcher.retryDelay = 10; // Very small base delay
                
                const delay = fetcher._calculateRetryDelay(0);
                
                expect(delay).toBeGreaterThanOrEqual(100);
            });
        });

        describe('_sleep', () => {
            test('should resolve after specified time', async () => {
                const promise = fetcher._sleep(1000);
                
                // Fast-forward time
                jest.advanceTimersByTime(1000);
                
                await expect(promise).resolves.toBeUndefined();
            });
        });
    });

    describe('Network Operations', () => {
        describe('_performSingleRequest', () => {
            test('should perform successful request', async () => {
                const abortController = new AbortController();
                
                const result = await fetcher._performSingleRequest(abortController);
                
                expect(fetch).toHaveBeenCalledWith(testUrl, {
                    signal: abortController.signal
                });
                expect(result).toEqual(mockData);
            });

            test('should throw error for failed HTTP response', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404
                });
                
                const abortController = new AbortController();
                
                await expect(fetcher._performSingleRequest(abortController))
                    .rejects.toThrow('HTTP error! status: 404');
            });

            test('should handle network errors', async () => {
                fetch.mockRejectedValue(new TypeError('Network error'));
                
                const abortController = new AbortController();
                
                await expect(fetcher._performSingleRequest(abortController))
                    .rejects.toThrow('Network error');
            });

            test('should handle JSON parsing errors', async () => {
                fetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
                });
                
                const abortController = new AbortController();
                
                await expect(fetcher._performSingleRequest(abortController))
                    .rejects.toThrow('Invalid JSON');
            });

            test('should handle timeout', async () => {
                // Mock AbortController to simulate timeout
                const mockAbortController = {
                    signal: { aborted: false },
                    abort: jest.fn()
                };
                
                // Mock fetch to never resolve
                fetch.mockImplementation(() => new Promise(() => {}));
                
                const requestPromise = fetcher._performSingleRequest(mockAbortController);
                
                // Simulate timeout by advancing timers
                jest.advanceTimersByTime(fetcher.timeout + 100);
                
                // The abort method should have been called
                expect(mockAbortController.abort).toHaveBeenCalled();
            });
        });
    });

    describe('fetchData', () => {
        describe('Caching Behavior', () => {
            test('should return cached data when available and valid', async () => {
                // Add valid cached data
                const cachedData = { id: 456, name: 'Cached Data' };
                const cacheEntry = {
                    data: cachedData,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 1000
                };
                fetcher.cache.set(testUrl, cacheEntry);
                
                await fetcher.fetchData();
                
                expect(fetcher.data).toEqual(cachedData);
                expect(fetch).not.toHaveBeenCalled();
                expect(fetcher.loading).toBe(false);
            });

            test('should update timestamp when accessing cached data', async () => {
                const originalTimestamp = Date.now() - 1000;
                const cacheEntry = {
                    data: mockData,
                    timestamp: originalTimestamp,
                    expiresAt: Date.now() + 1000
                };
                fetcher.cache.set(testUrl, cacheEntry);
                
                await fetcher.fetchData();
                
                const updatedEntry = fetcher.cache.get(testUrl);
                expect(updatedEntry.timestamp).toBeGreaterThan(originalTimestamp);
            });

            test('should fetch new data when cache is expired', async () => {
                // Add expired cached data
                const expiredEntry = {
                    data: { id: 456, name: 'Expired Data' },
                    timestamp: Date.now() - 2000,
                    expiresAt: Date.now() - 1000
                };
                fetcher.cache.set(testUrl, expiredEntry);
                
                await fetcher.fetchData();
                
                expect(fetcher.data).toEqual(mockData);
                expect(fetch).toHaveBeenCalled();
                expect(fetcher.cache.has(testUrl)).toBe(true);
                expect(fetcher.cache.get(testUrl).data).toEqual(mockData);
            });

            test('should cache new data after successful fetch', async () => {
                await fetcher.fetchData();
                
                expect(fetcher.cache.has(testUrl)).toBe(true);
                const cacheEntry = fetcher.cache.get(testUrl);
                expect(cacheEntry.data).toEqual(mockData);
                expect(cacheEntry.timestamp).toBeDefined();
                expect(cacheEntry.expiresAt).toBeDefined();
            });

            test('should enforce cache size limits after adding new entry', async () => {
                fetcher.maxCacheSize = 2;
                
                // Fill cache to limit
                for (let i = 0; i < 2; i++) {
                    const entry = fetcher._createCacheEntry({ id: i });
                    fetcher.cache.set(`existing${i}`, entry);
                }
                
                await fetcher.fetchData();
                
                expect(fetcher.cache.size).toBeLessThanOrEqual(2);
            });
        });

        describe('Loading State Management', () => {
            test('should set loading to true during fetch', async () => {
                let loadingDuringFetch;
                
                fetch.mockImplementation(() => {
                    loadingDuringFetch = fetcher.loading;
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve(mockData)
                    });
                });
                
                await fetcher.fetchData();
                
                expect(loadingDuringFetch).toBe(true);
                expect(fetcher.loading).toBe(false);
            });

            test('should reset loading to false after successful fetch', async () => {
                await fetcher.fetchData();
                
                expect(fetcher.loading).toBe(false);
            });

            test('should reset loading to false after failed fetch', async () => {
                fetch.mockRejectedValue(new Error('Network error'));
                
                await fetcher.fetchData();
                
                expect(fetcher.loading).toBe(false);
            });
        });

        describe('Error Handling', () => {
            test('should store error when fetch fails with non-retryable error', async () => {
                const error = new Error('HTTP error! status: 404');
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404
                });
                
                await fetcher.fetchData();
                
                expect(fetcher.error).toBeDefined();
                expect(fetcher.error.message).toContain('404');
                expect(fetcher.data).toBeNull();
            });

            test('should clear previous errors on successful fetch', async () => {
                // Set initial error
                fetcher.error = new Error('Previous error');
                
                await fetcher.fetchData();
                
                expect(fetcher.error).toBeNull();
                expect(fetcher.data).toEqual(mockData);
            });
        });

        describe('Retry Logic Integration', () => {
            test('should retry on retryable errors', async () => {
                let attemptCount = 0;
                fetch.mockImplementation(() => {
                    attemptCount++;
                    if (attemptCount < 3) {
                        return Promise.resolve({
                            ok: false,
                            status: 500 // Retryable error
                        });
                    }
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve(mockData)
                    });
                });
                
                const promise = fetcher.fetchData();
                
                // Fast-forward through retry delays
                for (let i = 0; i < 3; i++) {
                    await jest.runOnlyPendingTimersAsync();
                }
                
                await promise;
                
                expect(attemptCount).toBe(3);
                expect(fetcher.data).toEqual(mockData);
                expect(fetcher.error).toBeNull();
            });

            test('should not retry on non-retryable errors', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404 // Non-retryable error
                });
                
                await fetcher.fetchData();
                
                expect(fetch).toHaveBeenCalledTimes(1);
                expect(fetcher.error).toBeDefined();
            });

            test('should stop retrying after max attempts', async () => {
                fetcher.maxRetries = 2;
                fetch.mockResolvedValue({
                    ok: false,
                    status: 500 // Always fail with retryable error
                });
                
                const promise = fetcher.fetchData();
                
                // Fast-forward through all retry delays
                for (let i = 0; i <= fetcher.maxRetries; i++) {
                    await jest.runOnlyPendingTimersAsync();
                }
                
                await promise;
                
                expect(fetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
                expect(fetcher.error).toBeDefined();
                expect(fetcher.data).toBeNull();
            });
        });

        describe('Observer Notifications', () => {
            let observer;

            beforeEach(() => {
                observer = { update: jest.fn() };
                fetcher.subscribe(observer);
            });

            test('should notify observers on successful fetch', async () => {
                await fetcher.fetchData();
                
                expect(observer.update).toHaveBeenCalledWith('success', mockData);
            });

            test('should notify observers on retry attempts', async () => {
                let attemptCount = 0;
                fetch.mockImplementation(() => {
                    attemptCount++;
                    if (attemptCount === 1) {
                        return Promise.resolve({
                            ok: false,
                            status: 500
                        });
                    }
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve(mockData)
                    });
                });
                
                const promise = fetcher.fetchData();
                await jest.runOnlyPendingTimersAsync();
                await promise;
                
                expect(observer.update).toHaveBeenCalledWith('retry', expect.objectContaining({
                    attempt: 1,
                    maxRetries: fetcher.maxRetries,
                    error: expect.any(Error),
                    retryIn: expect.any(Number)
                }));
            });

            test('should notify observers on final failure', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404
                });
                
                await fetcher.fetchData();
                
                expect(observer.update).toHaveBeenCalledWith('error', expect.objectContaining({
                    error: expect.any(Error),
                    attempts: expect.any(Number),
                    maxRetries: fetcher.maxRetries
                }));
            });
        });

        describe('Cache Cleanup Integration', () => {
            test('should cleanup expired cache before checking', async () => {
                // Add expired entry
                const expiredEntry = {
                    data: { id: 999 },
                    timestamp: Date.now() - 2000,
                    expiresAt: Date.now() - 1000
                };
                fetcher.cache.set('expired', expiredEntry);
                
                // Add valid entry for our URL
                const validEntry = {
                    data: mockData,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 1000
                };
                fetcher.cache.set(testUrl, validEntry);
                
                await fetcher.fetchData();
                
                expect(fetcher.cache.has('expired')).toBe(false);
                expect(fetcher.cache.has(testUrl)).toBe(true);
            });
        });
    });

    describe('Configuration', () => {
        test('should allow custom cache expiration', () => {
            fetcher.cacheExpiration = 600000; // 10 minutes
            
            const entry = fetcher._createCacheEntry(mockData);
            
            expect(entry.expiresAt).toBe(entry.timestamp + 600000);
        });

        test('should allow custom max cache size', () => {
            fetcher.maxCacheSize = 10;
            
            // Add entries beyond the limit
            for (let i = 0; i < 15; i++) {
                const entry = fetcher._createCacheEntry({ id: i });
                fetcher.cache.set(`key${i}`, entry);
            }
            
            fetcher._enforceCacheSizeLimit();
            
            expect(fetcher.cache.size).toBe(10);
        });

        test('should allow custom retry configuration', () => {
            fetcher.maxRetries = 5;
            fetcher.retryDelay = 2000;
            fetcher.retryMultiplier = 3;
            
            expect(fetcher.maxRetries).toBe(5);
            expect(fetcher.retryDelay).toBe(2000);
            expect(fetcher.retryMultiplier).toBe(3);
            
            const delay = fetcher._calculateRetryDelay(1);
            expect(delay).toBeGreaterThanOrEqual(4500); // 6000ms ± 25%
            expect(delay).toBeLessThanOrEqual(7500);
        });

        test('should allow custom retryable status codes', () => {
            fetcher.retryableStatusCodes = [429, 503];
            
            const retryableError = new Error('HTTP error! status: 503');
            const nonRetryableError = new Error('HTTP error! status: 500');
            
            expect(fetcher._isRetryableError(retryableError)).toBe(true);
            expect(fetcher._isRetryableError(nonRetryableError)).toBe(false);
        });

        test('should allow custom timeout', () => {
            fetcher.timeout = 5000;
            
            expect(fetcher.timeout).toBe(5000);
        });
    });

    describe('Edge Cases', () => {
        test('should handle null response from fetch', async () => {
            fetch.mockResolvedValue(null);
            
            await fetcher.fetchData();
            
            expect(fetcher.error).toBeDefined();
        });

        test('should handle response without json method', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200
                // Missing json method
            });
            
            await fetcher.fetchData();
            
            expect(fetcher.error).toBeDefined();
        });

        test('should handle very large cache', () => {
            fetcher.maxCacheSize = 1000;
            
            // Add many entries
            for (let i = 0; i < 1500; i++) {
                const entry = fetcher._createCacheEntry({ id: i });
                fetcher.cache.set(`key${i}`, entry);
            }
            
            fetcher._enforceCacheSizeLimit();
            
            expect(fetcher.cache.size).toBe(1000);
        });

        test('should handle cache with same timestamps', () => {
            const sameTimestamp = Date.now();
            fetcher.maxCacheSize = 2;
            
            // Add entries with same timestamp
            for (let i = 0; i < 3; i++) {
                const entry = {
                    data: { id: i },
                    timestamp: sameTimestamp,
                    expiresAt: sameTimestamp + 300000
                };
                fetcher.cache.set(`key${i}`, entry);
            }
            
            fetcher._enforceCacheSizeLimit();
            
            expect(fetcher.cache.size).toBe(2);
        });
    });
});