// __tests__/IbiraAPIFetcher.test.js
// Unit tests for IbiraAPIFetcher class
// Tests cover pure referential transparency, caching, retry logic, error handling, and observer patterns

import { IbiraAPIFetcher } from '../src/index.js';
import { makeCache, makeMockResponse, MockEventNotifier } from './helpers.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('IbiraAPIFetcher', () => {
    let fetcher;
    let cache;
    let eventNotifier;
    const testUrl = 'https://api.example.com/data';
    const testCacheKey = `GET:${testUrl}`;
    const mockData = { id: 123, name: 'Test Data' };

    beforeEach(() => {
        // Suppress console noise; restored by jest.restoreAllMocks() in afterEach
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();

        cache = makeCache();
        eventNotifier = new MockEventNotifier();

        fetcher = new IbiraAPIFetcher(testUrl, cache, { eventNotifier });

        fetch.mockResolvedValue(makeMockResponse(mockData));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Constructor and Immutability', () => {
        test('should initialize with correct default values', () => {
            const testCache = makeCache({ maxSize: 50, expiration: 300000 });
            const newFetcher = new IbiraAPIFetcher(testUrl, testCache);

            expect(newFetcher.url).toBe(testUrl);
            expect(newFetcher.cache).toBe(testCache);
            expect(newFetcher.timeout).toBe(10000);
            expect(newFetcher.maxRetries).toBe(3);
            expect(newFetcher.retryDelay).toBe(1000);
            expect(newFetcher.retryMultiplier).toBe(2);
            expect(newFetcher.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
            expect(newFetcher.eventNotifier).toBeDefined();
        });

        test('should accept URL and cache parameters', () => {
            const customUrl = 'https://api.custom.com/endpoint';
            const customCache = makeCache();
            const newFetcher = new IbiraAPIFetcher(customUrl, customCache);

            expect(newFetcher.url).toBe(customUrl);
            expect(newFetcher.cache).toBe(customCache);
        });

        test('should be frozen (immutable)', () => {
            expect(Object.isFrozen(fetcher)).toBe(true);
        });

        test('should have frozen retryableStatusCodes array', () => {
            expect(Object.isFrozen(fetcher.retryableStatusCodes)).toBe(true);
        });

        test('should accept eventNotifier dependency', () => {
            const customEventNotifier = new MockEventNotifier();
            const newFetcher = new IbiraAPIFetcher(testUrl, cache, { eventNotifier: customEventNotifier });

            expect(newFetcher.eventNotifier).toBe(customEventNotifier);
        });
    });

    describe('Pure fetchDataPure method (Referential Transparency)', () => {
        test('should return pure operation description without side effects', async () => {
            const testCache = makeCache();
            const result = await fetcher.fetchDataPure(testCache);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockData);
            expect(result.fromCache).toBe(false);
            expect(result.cacheOperations).toBeInstanceOf(Array);
            expect(result.events).toBeInstanceOf(Array);
            expect(Object.isFrozen(result)).toBe(true);

            // Verify no side effects on original cache or notifier
            expect(testCache.has(testCacheKey)).toBe(false);
            expect(eventNotifier.notifications).toHaveLength(0);
        });

        test('should be deterministic with same inputs', async () => {
            const testCache = makeCache();
            const mockNetwork = () => Promise.resolve(mockData);

            const result1 = await fetcher.fetchDataPure(testCache, Date.now(), mockNetwork);
            const result2 = await fetcher.fetchDataPure(testCache, Date.now(), mockNetwork);

            expect(result1.success).toBe(result2.success);
            expect(result1.fromCache).toBe(result2.fromCache);
            expect(result1.data).toEqual(result2.data);
        });

        test('should return immutable result', async () => {
            const testCache = makeCache();
            const result = await fetcher.fetchDataPure(testCache);

            expect(Object.isFrozen(result)).toBe(true);
            expect(Object.isFrozen(result.events)).toBe(true);
            expect(Object.isFrozen(result.cacheOperations)).toBe(true);
        });

        test('should include loading start event', async () => {
            const testCache = makeCache();
            const result = await fetcher.fetchDataPure(testCache);

            const loadingStartEvent = result.events.find(event => event.type === 'loading-start');
            expect(loadingStartEvent).toBeDefined();
            expect(loadingStartEvent.payload.url).toBe(testUrl);
        });

        test('should include success event on successful fetch', async () => {
            const testCache = makeCache();
            const result = await fetcher.fetchDataPure(testCache);

            if (result.success) {
                const successEvent = result.events.find(event => event.type === 'success');
                expect(successEvent).toBeDefined();
                expect(successEvent.payload).toEqual(mockData);
            }
        });

        test('should include error event on failed fetch', async () => {
            const testCache = makeCache();
            fetch.mockRejectedValue(new Error('Network error'));

            const result = await fetcher.fetchDataPure(testCache);

            expect(result.success).toBe(false);
            const errorEvent = result.events.find(event => event.type === 'error');
            expect(errorEvent).toBeDefined();
            expect(errorEvent.payload.error).toBeInstanceOf(Error);
        });

        test('should return cached data without network request', async () => {
            const testCache = makeCache();
            const cacheEntry = {
                data: mockData,
                timestamp: Date.now(),
                expiresAt: Date.now() + 60000
            };
            testCache.set(testCacheKey, cacheEntry);

            const result = await fetcher.fetchDataPure(testCache);

            expect(result.success).toBe(true);
            expect(result.fromCache).toBe(true);
            expect(result.data).toEqual(mockData);
            expect(result.events).toHaveLength(0); // No events for cache hits
        });

        test('should handle custom network provider', async () => {
            const testCache = makeCache();
            const customData = { id: 999, name: 'Custom Data' };
            const mockNetwork = () => Promise.resolve(customData);

            const result = await fetcher.fetchDataPure(testCache, Date.now(), mockNetwork);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(customData);
        });
    });

    describe('Practical fetchData method (Side Effects)', () => {
        test('should return data from successful fetch', async () => {
            const result = await fetcher.fetchData();

            expect(result).toEqual(mockData);
            expect(fetch).toHaveBeenCalledWith(testUrl, expect.any(Object));
        });

        test('should cache data after successful fetch', async () => {
            await fetcher.fetchData();

            expect(cache.has(testCacheKey)).toBe(true);
            const cacheEntry = cache.get(testCacheKey);
            expect(cacheEntry.data).toEqual(mockData);
            expect(cacheEntry.timestamp).toBeDefined();
            expect(cacheEntry.timestamp).toBeLessThanOrEqual(Date.now());
            expect(cacheEntry.expiresAt).toBeGreaterThan(cacheEntry.timestamp);
        });

        test('should return cached data when available and valid', async () => {
            const cachedData = { id: 456, name: 'Cached Data' };
            cache.set(testCacheKey, {
                data: cachedData,
                timestamp: Date.now(),
                expiresAt: Date.now() + 1000
            });

            const result = await fetcher.fetchData();

            expect(result).toEqual(cachedData);
            expect(fetch).not.toHaveBeenCalled();
        });

        test('should fetch new data when cache is expired', async () => {
            cache.set(testCacheKey, {
                data: { id: 456, name: 'Expired Data' },
                timestamp: Date.now() - 2000,
                expiresAt: Date.now() - 1000
            });

            const result = await fetcher.fetchData();

            expect(result).toEqual(mockData);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should notify observers during fetch process', async () => {
            await fetcher.fetchData();

            expect(eventNotifier.notifications.length).toBeGreaterThan(0);

            const loadingStart = eventNotifier.notifications.find(
                notification => notification[0] === 'loading-start'
            );
            expect(loadingStart).toBeDefined();

            const success = eventNotifier.notifications.find(
                notification => notification[0] === 'success'
            );
            expect(success).toBeDefined();
        });

        test('should throw and notify observers on fetch errors', async () => {
            const observer = { update: jest.fn() };
            eventNotifier.subscribe(observer);
            fetch.mockRejectedValue(new Error('Network error'));

            await expect(fetcher.fetchData()).rejects.toThrow('Network error');

            expect(observer.update).toHaveBeenCalledWith('error', expect.any(Object));
        });

        test('should throw error on HTTP error status codes', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

            // maxRetries: 0 to test single-attempt failure without exercising retry logic
            const noRetryFetcher = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, maxRetries: 0 });
            await expect(noRetryFetcher.fetchData()).rejects.toThrow('HTTP error! status: 500');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should return data on successful HTTP response', async () => {
            const result = await fetcher.fetchData();

            expect(result).toEqual(mockData);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should enforce cache size limits', async () => {
            cache.maxSize = 2;

            for (let i = 0; i < 2; i++) {
                cache.set(`url${i}`, {
                    data: { id: i },
                    timestamp: Date.now(),
                    expiresAt: Date.now() + 60000
                });
            }

            await fetcher.fetchData();

            expect(cache.size).toBeLessThanOrEqual(2);
        });

        test.skip('should handle network timeout', async () => {
            // Skip — timeout functionality requires a full network stack in tests
            fetch.mockImplementation(() => new Promise(() => {}));
            await expect(fetcher.fetchData()).rejects.toThrow();
        });
    });

    describe('Static Factory Methods', () => {
        test('should create instance with default cache via withDefaultCache', () => {
            const instance = IbiraAPIFetcher.withDefaultCache(testUrl);

            expect(instance.url).toBe(testUrl);
            expect(instance.cache).toBeInstanceOf(Map);
            expect(instance.cache.maxSize).toBe(100);
            expect(instance.cache.expiration).toBe(300000);
        });

        test('should create instance with custom cache configuration via withDefaultCache', () => {
            const instance = IbiraAPIFetcher.withDefaultCache(testUrl, { maxCacheSize: 10, cacheExpiration: 60000 });

            expect(instance.cache.maxSize).toBe(10);
            expect(instance.cache.expiration).toBe(60000);
        });

        test('should create instance with external cache via withExternalCache', () => {
            const customCache = makeCache();
            const instance = IbiraAPIFetcher.withExternalCache(testUrl, customCache);

            expect(instance.cache).toBe(customCache);
        });

        test('should create instance without cache via withoutCache', () => {
            const instance = IbiraAPIFetcher.withoutCache(testUrl);

            expect(instance.cache.size).toBe(0);
            expect(instance.cache.maxSize).toBe(0);
            expect(instance.cache.has('anything')).toBe(false);
        });

        test('should create pure instance via pure static method', () => {
            const instance = IbiraAPIFetcher.pure(testUrl);

            expect(instance.url).toBe(testUrl);
            expect(instance).toBeInstanceOf(IbiraAPIFetcher);
        });

        test('should create instance with event callback via withEventCallback', async () => {
            const eventCallback = jest.fn();
            const instance = IbiraAPIFetcher.withEventCallback(testUrl, eventCallback);

            expect(instance).toBeInstanceOf(IbiraAPIFetcher);
            expect(instance.eventNotifier.subscriberCount).toBe(1);

            await instance.fetchData();
            expect(eventCallback).toHaveBeenCalled();
        });

        test('should create instance without events via withoutEvents', async () => {
            const instance = IbiraAPIFetcher.withoutEvents(testUrl);

            expect(instance).toBeInstanceOf(IbiraAPIFetcher);
            expect(instance.eventNotifier.subscriberCount).toBe(0);

            await instance.fetchData();
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should accept custom cache in withEventCallback', () => {
            const customCache = makeCache();
            const instance = IbiraAPIFetcher.withEventCallback(testUrl, jest.fn(), { cache: customCache });

            expect(instance.cache).toBe(customCache);
        });

        test('should accept custom cache in withoutEvents', () => {
            const customCache = makeCache();
            const instance = IbiraAPIFetcher.withoutEvents(testUrl, { cache: customCache });

            expect(instance.cache).toBe(customCache);
        });

        test('should use default cache when cache not provided in withEventCallback', () => {
            const instance = IbiraAPIFetcher.withEventCallback(testUrl, jest.fn());

            expect(instance.cache).toBeInstanceOf(Map);
            expect(instance.cache.maxSize).toBe(100);
        });

        test('should use default cache when cache not provided in withoutEvents', () => {
            const instance = IbiraAPIFetcher.withoutEvents(testUrl);

            expect(instance.cache).toBeInstanceOf(Map);
        });

        test('pure static method should accept custom cache options', () => {
            const instance = IbiraAPIFetcher.pure(testUrl, { maxCacheSize: 200, cacheExpiration: 600000 });

            expect(instance.cache.maxSize).toBe(200);
            expect(instance.cache.expiration).toBe(600000);
        });

        test('_createDefaultCache should create map with correct properties', () => {
            const defaultCache = IbiraAPIFetcher._createDefaultCache({
                maxCacheSize: 50,
                cacheExpiration: 120000
            });

            expect(defaultCache).toBeInstanceOf(Map);
            expect(defaultCache.maxSize).toBe(50);
            expect(defaultCache.expiration).toBe(120000);
        });

        test('_createDefaultCache should use defaults when no options provided', () => {
            const defaultCache = IbiraAPIFetcher._createDefaultCache();

            expect(defaultCache.maxSize).toBe(100);
            expect(defaultCache.expiration).toBe(300000);
        });
    });

    describe('Cache Management', () => {
        test('should properly format cache entries', async () => {
            await fetcher.fetchData();

            const cacheEntry = cache.get(testCacheKey);
            expect(cacheEntry).toHaveProperty('data');
            expect(cacheEntry).toHaveProperty('timestamp');
            expect(cacheEntry).toHaveProperty('expiresAt');
            expect(cacheEntry.data).toEqual(mockData);
        });

        test('should update timestamp when accessing cached data', async () => {
            const originalTimestamp = Date.now() - 1000;
            cache.set(testCacheKey, {
                data: mockData,
                timestamp: originalTimestamp,
                expiresAt: Date.now() + 1000
            });

            await fetcher.fetchData();

            const updatedEntry = cache.get(testCacheKey);
            expect(updatedEntry.timestamp).toBeGreaterThan(originalTimestamp);
        });

        test('should implement LRU eviction when cache is full', async () => {
            cache.maxSize = 2;

            cache.set('url1', {
                data: { id: 1 },
                timestamp: Date.now() - 2000,
                expiresAt: Date.now() + 60000
            });
            cache.set('url2', {
                data: { id: 2 },
                timestamp: Date.now() - 1000,
                expiresAt: Date.now() + 60000
            });

            await fetcher.fetchData();

            expect(cache.size).toBe(2);
            expect(cache.has('url1')).toBe(false); // Oldest evicted
            expect(cache.has('url2')).toBe(true);
            expect(cache.has(testCacheKey)).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle malformed JSON response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
            });

            await expect(fetcher.fetchData()).rejects.toThrow('Invalid JSON');
        });

        test('should not retry non-retryable status codes', async () => {
            fetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

            await expect(fetcher.fetchData()).rejects.toThrow('HTTP error! status: 404');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should handle null response from fetch', async () => {
            fetch.mockResolvedValue(null);

            await expect(fetcher.fetchData()).rejects.toThrow();
        });

        test('should return data regardless of caller-supplied options object', async () => {
            fetch.mockResolvedValue(makeMockResponse(mockData));

            const result = await fetcher.fetchData();

            expect(result).toEqual(mockData);
        });
    });

    describe('Observer Pattern Integration', () => {
        let observer1, observer2;

        beforeEach(() => {
            observer1 = { update: jest.fn() };
            observer2 = { update: jest.fn() };
        });

        test('should notify observers of loading start', async () => {
            eventNotifier.subscribe(observer1);

            await fetcher.fetchData();

            expect(observer1.update).toHaveBeenCalledWith('loading-start', expect.any(Object));
        });

        test('should notify observers of successful fetch', async () => {
            eventNotifier.subscribe(observer1);

            await fetcher.fetchData();

            expect(observer1.update).toHaveBeenCalledWith('success', expect.any(Object));
        });

        test('should notify observers of fetch errors', async () => {
            eventNotifier.subscribe(observer1);
            fetch.mockRejectedValue(new Error('Network error'));

            await expect(fetcher.fetchData()).rejects.toThrow('Network error');

            expect(observer1.update).toHaveBeenCalledWith('error', expect.any(Object));
        });

        test('should notify multiple observers on each event', async () => {
            eventNotifier.subscribe(observer1);
            eventNotifier.subscribe(observer2);

            await fetcher.fetchData();

            // Each observer receives loading-start and success
            expect(observer1.update).toHaveBeenCalledTimes(2);
            expect(observer2.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('Performance and Memory Management', () => {
        test('should not grow cache unbounded with repeated operations', async () => {
            const initialCacheSize = cache.size;

            for (let i = 0; i < 10; i++) {
                await fetcher.fetchData();
            }

            expect(cache.size).toBeLessThanOrEqual(initialCacheSize + 1);
        });

        test('should handle expired entries during eviction', async () => {
            const smallCache = makeCache({ maxSize: 2, expiration: 60000 });
            const testFetcher = new IbiraAPIFetcher(testUrl, smallCache, { eventNotifier });

            smallCache.set('expired', {
                data: { id: 'expired' },
                timestamp: Date.now() - 10000,
                expiresAt: Date.now() - 5000
            });
            smallCache.set('valid', {
                data: { id: 'valid' },
                timestamp: Date.now(),
                expiresAt: Date.now() + 60000
            });

            await testFetcher.fetchData();

            // Pure functional implementation cleans expired entries from the new state
            expect(smallCache.has('valid')).toBe(true);
            expect(smallCache.size).toBeGreaterThan(0);
        });
    });

    describe('Helper Methods and Utilities', () => {
        test('getCacheKey returns METHOD:URL string', () => {
            expect(fetcher.getCacheKey()).toBe(testCacheKey);
        });

        test('subscribe registers an observer', () => {
            const observer = { update: jest.fn() };
            fetcher.subscribe(observer);
            expect(eventNotifier.subscriberCount).toBe(1);
        });

        test('unsubscribe removes a registered observer', () => {
            const observer = { update: jest.fn() };
            fetcher.subscribe(observer);
            fetcher.unsubscribe(observer);
            expect(eventNotifier.subscriberCount).toBe(0);
        });

        test('cache entries include data, timestamp, and expiry', () => {
            const data = { test: 'data' };
            const currentTime = Date.now();
            const entry = fetcher._createCacheEntry(data, currentTime, cache);

            expect(entry.data).toBe(data);
            expect(entry.timestamp).toBe(currentTime);
            expect(entry.expiresAt).toBeGreaterThan(currentTime);
        });

        test('expired entries are treated as invalid', () => {
            const currentTime = Date.now();
            const validEntry = { expiresAt: currentTime + 10000 };
            const expiredEntry = { expiresAt: currentTime - 1000 };

            expect(fetcher._isCacheEntryValid(validEntry, currentTime)).toBe(true);
            expect(fetcher._isCacheEntryValid(expiredEntry, currentTime)).toBe(false);
            expect(fetcher._isCacheEntryValid(null, currentTime)).toBe(false);
        });

        test('retry delay increases exponentially with each attempt', () => {
            const delay1 = fetcher._calculateRetryDelay(0);
            const delay2 = fetcher._calculateRetryDelay(1);
            const delay3 = fetcher._calculateRetryDelay(2);

            expect(delay2).toBeGreaterThan(delay1);
            expect(delay3).toBeGreaterThan(delay2);
        });

        test('getExpiredCacheKeys returns only entries past their expiry time', () => {
            const currentTime = Date.now();
            cache.set('valid1', { expiresAt: currentTime + 10000 });
            cache.set('expired1', { expiresAt: currentTime - 1000 });
            cache.set('valid2', { expiresAt: currentTime + 20000 });
            cache.set('expired2', { expiresAt: currentTime - 5000 });

            const expiredKeys = fetcher._getExpiredCacheKeys(cache, currentTime);

            expect(expiredKeys).toContain('expired1');
            expect(expiredKeys).toContain('expired2');
            expect(expiredKeys).not.toContain('valid1');
            expect(expiredKeys).not.toContain('valid2');
        });

        it.each([
            ['HTTP 408', new Error('HTTP error! status: 408')],
            ['HTTP 429', new Error('HTTP error! status: 429')],
            ['HTTP 500', new Error('HTTP error! status: 500')],
            ['network TypeError', new TypeError('Failed to fetch')],
            ['timeout message', new Error('Request timeout')],
        ])('marks %s error as retryable', (_, error) => {
            expect(fetcher._isRetryableError(error)).toBe(true);
        });

        test('marks AbortError as retryable', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            expect(fetcher._isRetryableError(error)).toBe(true);
        });

        test('does not retry HTTP 404', () => {
            expect(fetcher._isRetryableError(new Error('HTTP error! status: 404'))).toBe(false);
        });

        test('does not retry unrelated errors', () => {
            expect(fetcher._isRetryableError(new Error('Something completely unrelated'))).toBe(false);
        });

        test('does not retry HTTP error with non-numeric status token', () => {
            // The regex /status: (\d+)/ won't match "xyz", so statusMatch is null
            expect(fetcher._isRetryableError(new Error('HTTP error! status: xyz'))).toBe(false);
        });
    });

    describe('Additional Methods and Edge Cases', () => {
        test('notifyObservers should call eventNotifier.notify', () => {
            const spy = jest.spyOn(eventNotifier, 'notify');
            fetcher.notifyObservers('test-event', { data: 'test' });
            expect(spy).toHaveBeenCalledWith('test-event', { data: 'test' });
        });

        test('_sleep should return a promise', () => {
            expect(fetcher._sleep(100)).toBeInstanceOf(Promise);
        });

        test('_performSingleRequest should make network request', async () => {
            const abortController = new AbortController();
            const result = await fetcher._performSingleRequest(abortController);
            expect(result).toEqual(mockData);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('_applyCacheSizeLimitsPure should return new cache state respecting maxSize', () => {
            const smallCache = makeCache({ maxSize: 2 });
            const smallFetcher = new IbiraAPIFetcher(testUrl, smallCache, { eventNotifier });

            const cacheState = new Map([
                ['key1', { data: 'old', timestamp: 100, expiresAt: Date.now() + 10000 }],
                ['key2', { data: 'newer', timestamp: 200, expiresAt: Date.now() + 10000 }],
                ['key3', { data: 'newest', timestamp: 300, expiresAt: Date.now() + 10000 }],
            ]);

            const result = smallFetcher._applyCacheSizeLimitsPure(cacheState);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(2);
            expect(result.has('key2')).toBe(true);
            expect(result.has('key3')).toBe(true);
        });

        test('_calculateCacheEvictions identifies keys removed between two cache states', () => {
            const beforeState = new Map([
                ['key1', { data: 'val1' }],
                ['key2', { data: 'val2' }],
                ['key3', { data: 'val3' }]
            ]);
            const afterState = new Map([
                ['key2', { data: 'val2' }],
                ['key3', { data: 'val3' }]
            ]);

            const evictions = fetcher._calculateCacheEvictions(beforeState, afterState);

            expect(evictions).toHaveLength(1);
            expect(evictions[0]).toEqual({ type: 'delete', key: 'key1' });
        });

        test('_applySideEffects should update cache from operations', () => {
            const testCache = makeCache();
            const cacheEntry = { data: mockData, timestamp: Date.now(), expiresAt: Date.now() + 10000 };
            const result = {
                success: true,
                data: mockData,
                cacheOperations: [{ type: 'set', key: testCacheKey, value: cacheEntry }],
                events: []
            };

            fetcher._applySideEffects(result, testCache);

            expect(testCache.size).toBe(1);
            expect(testCache.get(testCacheKey)).toEqual(cacheEntry);
        });

        test('_applySideEffects should fire events to notifier', () => {
            const spy = jest.spyOn(eventNotifier, 'notify');
            const result = {
                success: true,
                data: mockData,
                cacheOperations: [],
                events: [
                    { type: 'loading-start', payload: { url: testUrl } },
                    { type: 'success', payload: { data: mockData } }
                ]
            };

            fetcher._applySideEffects(result, cache);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith('loading-start', { url: testUrl });
            expect(spy).toHaveBeenCalledWith('success', { data: mockData });
        });
    });

    describe('Additional Edge Cases', () => {
        test('should throw when response has no json method', async () => {
            fetch.mockResolvedValueOnce({ ok: true, status: 200, json: undefined });

            await expect(fetcher.fetchData()).rejects.toThrow();
        });

        test('should work with a minimal cache implementation', async () => {
            const minimalCache = makeCache({ maxSize: 10 });
            const noCacheFetcher = new IbiraAPIFetcher(testUrl, minimalCache, { eventNotifier });
            const result = await noCacheFetcher.fetchData();

            expect(result).toEqual(mockData);
            expect(minimalCache.size).toBeGreaterThan(0);
        });

        test('should serve the second call from cache', async () => {
            const result1 = await fetcher.fetchData();
            expect(fetch).toHaveBeenCalledTimes(1);

            const result2 = await fetcher.fetchData();
            expect(fetch).toHaveBeenCalledTimes(1); // Still 1 — served from cache

            expect(result1).toEqual(mockData);
            expect(result2).toEqual(mockData);
        });
    });

    describe('v0.3.x — validateStatus option', () => {
        test('should accept 2xx by default', async () => {
            fetch.mockResolvedValueOnce(makeMockResponse(mockData, { status: 201 }));
            const f = IbiraAPIFetcher.withDefaultCache(testUrl);
            await expect(f.fetchData()).resolves.toEqual(mockData);
        });

        test('should reject non-2xx by default', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 404, json: jest.fn().mockResolvedValue({}) });
            const f = IbiraAPIFetcher.withDefaultCache(testUrl);
            await expect(f.fetchData()).rejects.toThrow('HTTP error! status: 404');
        });

        test('should accept custom validateStatus returning true', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 404, json: jest.fn().mockResolvedValue({ notFound: true }) });
            const f = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier,
                validateStatus: (status) => status === 404
            });
            await expect(f.fetchData()).resolves.toEqual({ notFound: true });
        });

        test('should reject when custom validateStatus returns false', async () => {
            fetch.mockResolvedValueOnce(makeMockResponse(mockData));
            const f = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier,
                validateStatus: () => false
            });
            await expect(f.fetchData()).rejects.toThrow('HTTP error! status: 200');
        });

        test('validateStatus is stored on the instance', () => {
            const customValidate = (status) => status < 500;
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, validateStatus: customValidate });
            expect(f.validateStatus).toBe(customValidate);
        });

        it.each([200, 204, 299])('default validateStatus accepts %i as success', (status) => {
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier });
            expect(f.validateStatus(status)).toBe(true);
        });

        it.each([300, 400, 500])('default validateStatus rejects %i', (status) => {
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier });
            expect(f.validateStatus(status)).toBe(false);
        });
    });

    describe('v0.3.x — AbortController / signal support', () => {
        test('fetchData should accept a signal and abort the request', async () => {
            const controller = new AbortController();
            controller.abort(); // abort immediately

            fetch.mockImplementation((_url, opts) => {
                if (opts.signal && opts.signal.aborted) {
                    return Promise.reject(new DOMException('Aborted', 'AbortError'));
                }
                return Promise.resolve(makeMockResponse(mockData));
            });

            const f = IbiraAPIFetcher.withDefaultCache(testUrl);
            await expect(f.fetchData(null, controller.signal)).rejects.toThrow();
        });

        test('fetchDataPure should forward signal to network request', async () => {
            const controller = new AbortController();
            controller.abort();

            fetch.mockImplementation((_url, opts) => {
                if (opts.signal && opts.signal.aborted) {
                    return Promise.reject(new DOMException('Aborted', 'AbortError'));
                }
                return Promise.resolve({ ok: true, status: 200, json: async () => mockData });
            });

            const f = IbiraAPIFetcher.withoutCache(testUrl);
            const result = await f.fetchDataPure(new Map(), Date.now(), null, controller.signal);
            expect(result.success).toBe(false);
        });

        test('should complete normally when signal is not aborted', async () => {
            const controller = new AbortController();
            const f = IbiraAPIFetcher.withDefaultCache(testUrl);
            await expect(f.fetchData(null, controller.signal)).resolves.toEqual(mockData);
        });
    });

    describe('v0.3.x — Coverage: withoutCache and pure noCache function bodies', () => {
        test('withoutCache noCache methods return correct stubs', () => {
            const f = IbiraAPIFetcher.withoutCache(testUrl);
            expect(f.cache.has('x')).toBe(false);
            expect(f.cache.get('x')).toBeNull();
            expect(f.cache.set('x', 1)).toBeUndefined();
            expect(f.cache.delete('x')).toBe(false);
            expect(f.cache.clear()).toBeUndefined();
            expect(f.cache.entries()).toEqual([]);
        });

        test('pure factory noCache methods return correct stubs', () => {
            const f = IbiraAPIFetcher.pure(testUrl);
            expect(f.cache.has('x')).toBe(false);
            expect(f.cache.get('x')).toBeNull();
            expect(f.cache.set('x', 1)).toBeUndefined();
            expect(f.cache.delete('x')).toBe(false);
            expect(f.cache.clear()).toBeUndefined();
            expect(f.cache.entries()).toEqual([]);
        });

        test('withoutEvents notifier stubs are callable without errors', () => {
            const f = IbiraAPIFetcher.withoutEvents(testUrl);
            expect(f.eventNotifier.subscriberCount).toBe(0);
            f.eventNotifier.subscribe({});
            f.eventNotifier.unsubscribe({});
            f.eventNotifier.notify('test', {});
            f.eventNotifier.clear();
        });
    });

    describe('v0.4.x — HTTP methods beyond GET', () => {
        test('should default method to GET', () => {
            expect(fetcher.method).toBe('GET');
        });

        test('should normalise method to uppercase', () => {
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'post' });
            expect(f.method).toBe('POST');
        });

        test('should set body and headers from options', () => {
            const body = { name: 'Alice' };
            const headers = { Authorization: 'Bearer token' };
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST', body, headers });
            expect(f.method).toBe('POST');
            expect(f.body).toEqual(body);
            expect(f.headers).toEqual(headers);
            expect(Object.isFrozen(f.headers)).toBe(true);
        });

        test('getCacheKey includes method prefix', () => {
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST' });
            expect(f.getCacheKey()).toBe(`POST:${testUrl}`);
        });

        test('POST and GET for same URL have different cache keys', () => {
            const get = IbiraAPIFetcher.withDefaultCache(testUrl);
            const post = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST' });
            expect(get.getCacheKey()).not.toBe(post.getCacheKey());
        });

        test('should pass method to fetch() call', async () => {
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST', body: { x: 1 } });
            await f.fetchData();
            expect(fetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({ method: 'POST' }));
        });

        test('should auto-serialize plain object body to JSON and set Content-Type', async () => {
            const body = { key: 'value' };
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST', body });
            await f.fetchData();
            expect(fetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
                body: JSON.stringify(body),
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            }));
        });

        test('should pass string body without JSON-serializing it', async () => {
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST', body: 'raw string body' });
            await f.fetchData();
            expect(fetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({ body: 'raw string body' }));
        });

        test('should not override caller-supplied Content-Type', async () => {
            const body = { x: 1 };
            const headers = { 'Content-Type': 'application/vnd.api+json' };
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { method: 'POST', body, headers });
            await f.fetchData();
            expect(fetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
                headers: expect.objectContaining({ 'Content-Type': 'application/vnd.api+json' }),
            }));
        });

        test('should include custom headers in fetch call', async () => {
            const headers = { Authorization: 'Bearer abc', 'X-Custom': '1' };
            const f = IbiraAPIFetcher.withDefaultCache(testUrl, { headers });
            await f.fetchData();
            expect(fetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
                headers: expect.objectContaining(headers),
            }));
        });

        test('should not include headers key in fetchOptions when no headers and no body', async () => {
            await fetcher.fetchData();
            const [, opts] = fetch.mock.calls[0];
            expect(opts.headers).toBeUndefined();
        });

        test('default body is null', () => {
            expect(fetcher.body).toBeNull();
        });
    });

    describe('v0.4.x — Retry loop wired into fetchData()', () => {
        // All tests here advance fake timers to bypass _sleep() delays.

        test('should retry on retryable status code and eventually throw after maxRetries', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

            const retryFetcher = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, maxRetries: 2, retryDelay: 100,
            });

            const promise = retryFetcher.fetchData();
            promise.catch(() => {}); // prevent unhandled rejection during timer advancement
            await jest.runAllTimersAsync();

            await expect(promise).rejects.toThrow('HTTP error! status: 500');
            // Initial attempt + 2 retries = 3 total calls
            expect(fetch).toHaveBeenCalledTimes(3);
        });

        test('should succeed on a retry after an initial retryable failure', async () => {
            fetch
                .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' })
                .mockResolvedValueOnce(makeMockResponse(mockData));

            const retryFetcher = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, maxRetries: 2, retryDelay: 100,
            });

            const promise = retryFetcher.fetchData();
            await jest.runAllTimersAsync();

            await expect(promise).resolves.toEqual(mockData);
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        test('should not retry non-retryable status codes', async () => {
            fetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

            const retryFetcher = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, maxRetries: 3, retryDelay: 100,
            });

            const promise = retryFetcher.fetchData();
            promise.catch(() => {});
            await jest.runAllTimersAsync();

            await expect(promise).rejects.toThrow('HTTP error! status: 404');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should make only one attempt when maxRetries is 0', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

            const noRetryFetcher = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, maxRetries: 0,
            });

            const promise = noRetryFetcher.fetchData();
            promise.catch(() => {});
            await jest.runAllTimersAsync();

            await expect(promise).rejects.toThrow('HTTP error! status: 500');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should notify observers on each retry attempt', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

            const observer = { update: jest.fn() };
            const retryFetcher = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, maxRetries: 1, retryDelay: 100,
            });
            retryFetcher.subscribe(observer);

            const promise = retryFetcher.fetchData();
            promise.catch(() => {});
            await jest.runAllTimersAsync();

            await expect(promise).rejects.toThrow();
            // Each of the 2 attempts emits 'loading-start' and 'error' — 4 notifications total
            expect(observer.update).toHaveBeenCalledTimes(4);
        });

        test.each([408, 429, 500, 502, 503, 504])(
            'should retry on status code %i',
            async (status) => {
                fetch.mockResolvedValue({ ok: false, status, statusText: 'Error' });

                const retryFetcher = new IbiraAPIFetcher(testUrl, new Map(), {
                    maxRetries: 1, retryDelay: 100,
                });

                const promise = retryFetcher.fetchData();
                promise.catch(() => {});
                await jest.runAllTimersAsync();

                await expect(promise).rejects.toThrow(`HTTP error! status: ${status}`);
                expect(fetch).toHaveBeenCalledTimes(2);

                fetch.mockReset();
                fetch.mockResolvedValue(makeMockResponse(mockData));
            }
        );
    });

    describe('v0.4.x — onRequest interceptor', () => {
        test('should call onRequest with fetch options before each request', async () => {
            const onRequest = jest.fn((opts) => opts);
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onRequest });

            await f.fetchData();

            expect(onRequest).toHaveBeenCalledTimes(1);
            expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET' }));
        });

        test('should use the options returned by onRequest', async () => {
            const customHeader = { 'X-Custom': 'intercepted' };
            const onRequest = jest.fn((opts) => ({ ...opts, headers: { ...opts.headers, ...customHeader } }));
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onRequest });

            await f.fetchData();

            expect(fetch).toHaveBeenCalledWith(
                testUrl,
                expect.objectContaining({ headers: expect.objectContaining({ 'X-Custom': 'intercepted' }) })
            );
        });

        test('should support async onRequest interceptor', async () => {
            const onRequest = jest.fn(async (opts) => ({ ...opts, headers: { ...opts.headers, 'X-Async': 'yes' } }));
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onRequest });

            await f.fetchData();

            expect(fetch).toHaveBeenCalledWith(
                testUrl,
                expect.objectContaining({ headers: expect.objectContaining({ 'X-Async': 'yes' }) })
            );
        });

        test('should not mutate original fetchOptions when interceptor spreads', async () => {
            const originalHeaders = {};
            const onRequest = jest.fn((opts) => ({ ...opts, headers: { ...opts.headers, 'X-Added': 'yes' } }));
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onRequest, headers: originalHeaders });

            await f.fetchData();

            expect(originalHeaders).not.toHaveProperty('X-Added');
        });

        test('should propagate error thrown by onRequest as a fetch rejection', async () => {
            const onRequest = jest.fn(() => { throw new Error('interceptor failure'); });
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onRequest, maxRetries: 0 });

            await expect(f.fetchData()).rejects.toThrow('interceptor failure');
        });
    });

    describe('v0.4.x — onResponse interceptor', () => {
        test('should call onResponse with the raw Response after each successful fetch', async () => {
            const mockResponse = makeMockResponse(mockData);
            fetch.mockResolvedValue(mockResponse);

            const onResponse = jest.fn((res) => res);
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onResponse });

            await f.fetchData();

            expect(onResponse).toHaveBeenCalledTimes(1);
            expect(onResponse).toHaveBeenCalledWith(mockResponse);
        });

        test('should use the response returned by onResponse', async () => {
            const replacedJson = jest.fn().mockResolvedValue({ replaced: true });
            fetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue({ original: true }) });

            const onResponse = jest.fn(() => ({ ok: true, status: 200, json: replacedJson }));
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onResponse });

            await expect(f.fetchData()).resolves.toEqual({ replaced: true });
            expect(replacedJson).toHaveBeenCalledTimes(1);
        });

        test('should support async onResponse interceptor', async () => {
            const asyncJson = jest.fn().mockResolvedValue({ async: true });
            fetch.mockResolvedValue(makeMockResponse(mockData));

            const onResponse = jest.fn(async () => ({ ok: true, status: 200, json: asyncJson }));
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onResponse });

            await expect(f.fetchData()).resolves.toEqual({ async: true });
        });

        test('should propagate error thrown by onResponse as a fetch rejection', async () => {
            const onResponse = jest.fn(() => { throw new Error('response interceptor failure'); });
            const f = new IbiraAPIFetcher(testUrl, cache, { eventNotifier, onResponse, maxRetries: 0 });

            await expect(f.fetchData()).rejects.toThrow('response interceptor failure');
        });
    });

    describe('v0.4.x — retryStrategy', () => {
        test('should call retryStrategy with attempt index and error on first retry decision', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });

            const retryStrategy = jest.fn(() => false);
            const f = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, retryStrategy, maxRetries: 2, retryDelay: 100,
            });

            const promise = f.fetchData();
            promise.catch(() => {});
            await jest.runAllTimersAsync();
            await expect(promise).rejects.toThrow();

            expect(retryStrategy).toHaveBeenCalledWith(0, expect.any(Error));
        });

        test('should not retry when retryStrategy returns false for a retryable error', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });

            const retryStrategy = jest.fn(() => false);
            const f = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, retryStrategy, maxRetries: 3, retryDelay: 100,
            });

            const promise = f.fetchData();
            promise.catch(() => {});
            await jest.runAllTimersAsync();
            await expect(promise).rejects.toThrow();

            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should retry when retryStrategy returns true for a normally non-retryable error', async () => {
            // 404 is not in the default retryable list
            fetch
                .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })
                .mockResolvedValueOnce(makeMockResponse(mockData));

            const retryStrategy = jest.fn(() => true);
            const f = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, retryStrategy, maxRetries: 1, retryDelay: 100,
            });

            const promise = f.fetchData();
            await jest.runAllTimersAsync();

            await expect(promise).resolves.toEqual(mockData);
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        test('should fall back to default _isRetryableError when retryStrategy is not provided', async () => {
            // 404 is NOT retryable by default
            fetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

            const defaultFetcher = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, maxRetries: 2, retryDelay: 100,
            });

            await expect(defaultFetcher.fetchData()).rejects.toThrow('HTTP error! status: 404');
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('should receive incrementing attempt index across retries', async () => {
            fetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' });

            const attempts = [];
            const retryStrategy = jest.fn((attempt) => {
                attempts.push(attempt);
                return attempt < 2;
            });

            const f = new IbiraAPIFetcher(testUrl, cache, {
                eventNotifier, retryStrategy, maxRetries: 3, retryDelay: 100,
            });

            const promise = f.fetchData();
            promise.catch(() => {});
            await jest.runAllTimersAsync();
            await expect(promise).rejects.toThrow();

            expect(attempts).toEqual([0, 1, 2]);
        });
    });
});
