// __tests__/integration.test.js
// Integration tests: real DefaultCache + real DefaultEventNotifier — only global.fetch is mocked.
// These tests verify cross-module wiring that unit tests can't catch because they inject mocks.

import {
    IbiraAPIFetcher,
    IbiraAPIFetchManager,
    DefaultCache,
    DefaultEventNotifier,
} from '../src/index.js';
import { makeMockResponse } from './helpers.js';

global.fetch = jest.fn();

const URL_A = 'https://api.example.com/a';
const URL_B = 'https://api.example.com/b';
const DATA_A = { id: 1, name: 'alpha' };
const DATA_B = { id: 2, name: 'beta' };

// ---------------------------------------------------------------------------
// IbiraAPIFetcher ↔ DefaultCache
// ---------------------------------------------------------------------------

describe('IbiraAPIFetcher ↔ DefaultCache', () => {
    let cache;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.useFakeTimers();
        jest.clearAllMocks();
        cache = new DefaultCache({ maxSize: 10, expiration: 5 * 60 * 1000 });
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('stores a valid CacheEntry in DefaultCache after the first fetch', async () => {
        const fetcher = IbiraAPIFetcher.withExternalCache(URL_A, cache);
        await fetcher.fetchData();

        const key = `GET:${URL_A}`;
        expect(cache.has(key)).toBe(true);
        const entry = cache.get(key);
        expect(entry.data).toEqual(DATA_A);
        expect(typeof entry.timestamp).toBe('number');
        expect(entry.expiresAt).toBeGreaterThan(entry.timestamp);
    });

    it('serves the second fetch from DefaultCache without an additional network call', async () => {
        const fetcher = IbiraAPIFetcher.withExternalCache(URL_A, cache);
        const first = await fetcher.fetchData();
        const second = await fetcher.fetchData();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(second).toEqual(first);
    });

    it('re-fetches after the cached entry expires', async () => {
        const expiration = 1000;
        cache = new DefaultCache({ maxSize: 10, expiration });
        const fetcher = IbiraAPIFetcher.withExternalCache(URL_A, cache);

        await fetcher.fetchData();
        expect(global.fetch).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(expiration + 1);

        await fetcher.fetchData();
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('evicts the oldest entry when DefaultCache maxSize is exceeded', async () => {
        cache = new DefaultCache({ maxSize: 2, expiration: 60_000 });
        const urls = [
            'https://api.example.com/lru-1',
            'https://api.example.com/lru-2',
            'https://api.example.com/lru-3',
        ];

        for (const url of urls) {
            const fetcher = IbiraAPIFetcher.withExternalCache(url, cache);
            await fetcher.fetchData();
        }

        expect(cache.size).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// IbiraAPIFetcher ↔ DefaultEventNotifier
// ---------------------------------------------------------------------------

describe('IbiraAPIFetcher ↔ DefaultEventNotifier', () => {
    let notifier;
    let received;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.useFakeTimers();
        jest.clearAllMocks();
        notifier = new DefaultEventNotifier();
        received = [];
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));
    });

    afterEach(() => {
        notifier.clear();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('fires loading-start then success through a real DefaultEventNotifier', async () => {
        notifier.subscribe({ update: (type, payload) => received.push({ type, payload }) });
        const fetcher = IbiraAPIFetcher.withDefaultCache(URL_A, { eventNotifier: notifier });

        await fetcher.fetchData();

        expect(received).toHaveLength(2);
        expect(received[0].type).toBe('loading-start');
        expect(received[1].type).toBe('success');
        expect(received[1].payload).toEqual(DATA_A);
    });

    it('fires loading-start then error through a real DefaultEventNotifier', async () => {
        notifier.subscribe({ update: (type, payload) => received.push({ type, payload }) });
        global.fetch.mockRejectedValue(new Error('network failure'));
        const fetcher = IbiraAPIFetcher.withDefaultCache(URL_A, {
            eventNotifier: notifier,
            maxRetries: 0,
        });

        await expect(fetcher.fetchData()).rejects.toThrow();

        const types = received.map((e) => e.type);
        expect(types).toContain('loading-start');
        expect(types).toContain('error');
    });

    it('fires no events on a cache hit', async () => {
        notifier.subscribe({ update: (type, payload) => received.push({ type, payload }) });
        const fetcher = IbiraAPIFetcher.withDefaultCache(URL_A, { eventNotifier: notifier });

        await fetcher.fetchData(); // network — fires events
        received.length = 0;      // reset

        await fetcher.fetchData(); // cache hit — should fire nothing
        expect(received).toHaveLength(0);
    });

    it('isolates a throwing observer so others still receive events', async () => {
        const good = [];
        notifier.subscribe({ update: () => { throw new Error('bad observer'); } });
        notifier.subscribe({ update: (type) => good.push(type) });

        const fetcher = IbiraAPIFetcher.withDefaultCache(URL_A, { eventNotifier: notifier });
        await fetcher.fetchData();

        expect(good).toContain('success');
    });

    it('stops delivering events after unsubscribe', async () => {
        const observer = { update: (type) => received.push(type) };
        notifier.subscribe(observer);
        notifier.unsubscribe(observer);

        const fetcher = IbiraAPIFetcher.withDefaultCache(URL_A, { eventNotifier: notifier });
        await fetcher.fetchData();

        expect(received).toHaveLength(0);
    });

    it('reflects accurate subscriberCount as observers join and leave', () => {
        expect(notifier.subscriberCount).toBe(0);
        const obs1 = { update: () => {} };
        const obs2 = { update: () => {} };

        notifier.subscribe(obs1);
        expect(notifier.subscriberCount).toBe(1);

        notifier.subscribe(obs2);
        expect(notifier.subscriberCount).toBe(2);

        notifier.unsubscribe(obs1);
        expect(notifier.subscriberCount).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// IbiraAPIFetchManager — shared globalCache across fetchers
// ---------------------------------------------------------------------------

describe('IbiraAPIFetchManager — shared globalCache', () => {
    let manager;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.useFakeTimers();
        manager = new IbiraAPIFetchManager({ maxCacheSize: 50, cacheExpiration: 5 * 60 * 1000 });
        jest.clearAllMocks();
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));
    });

    afterEach(() => {
        manager.destroy();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('writes entries for distinct URLs into the same globalCache', async () => {
        global.fetch
            .mockResolvedValueOnce(makeMockResponse(DATA_A))
            .mockResolvedValueOnce(makeMockResponse(DATA_B));
        await manager.fetch(URL_A);
        await manager.fetch(URL_B);

        expect(manager.globalCache.has(`GET:${URL_A}`)).toBe(true);
        expect(manager.globalCache.has(`GET:${URL_B}`)).toBe(true);
        expect(manager.globalCache.size).toBe(2);
    });

    it('serves a repeat fetch of the same URL from globalCache without a second network call', async () => {
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));

        await manager.fetch(URL_A);
        const second = await manager.fetch(URL_A);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(second).toEqual(DATA_A);
    });

    it('shares globalCache across fetchers created for different URLs', async () => {
        global.fetch
            .mockResolvedValueOnce(makeMockResponse(DATA_A))
            .mockResolvedValueOnce(makeMockResponse(DATA_B));
        await manager.fetch(URL_A);
        await manager.fetch(URL_B);

        // Both fetchers reference the same cache object
        const fetcherA = manager.getFetcher(URL_A);
        const fetcherB = manager.getFetcher(URL_B);
        expect(fetcherA.cache).toBe(fetcherB.cache);
    });

    it('removes expired entries from globalCache on periodic cleanup', async () => {
        const shortExpiry = 1000;
        const shortManager = new IbiraAPIFetchManager({
            cacheExpiration: shortExpiry,
            cleanupInterval: 500,
        });
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));

        await shortManager.fetch(URL_A);
        expect(shortManager.globalCache.size).toBe(1);

        // Advance past both expiry and cleanup interval
        await jest.advanceTimersByTimeAsync(shortExpiry + 600);

        expect(shortManager.globalCache.size).toBe(0);
        shortManager.destroy();
    });
});

// ---------------------------------------------------------------------------
// IbiraAPIFetchManager — event flow through DefaultEventNotifier
// ---------------------------------------------------------------------------

describe('IbiraAPIFetchManager — events via DefaultEventNotifier', () => {
    let manager;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.useFakeTimers();
        manager = new IbiraAPIFetchManager();
        jest.clearAllMocks();
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));
    });

    afterEach(() => {
        manager.destroy();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('delivers loading-start and success events to a subscribed observer', async () => {
        const received = [];
        manager.subscribe(URL_A, { update: (type, payload) => received.push({ type, payload }) });

        await manager.fetch(URL_A);

        const types = received.map((e) => e.type);
        expect(types).toContain('loading-start');
        expect(types).toContain('success');
    });

    it('delivers error events when the network fails', async () => {
        global.fetch.mockReset();
        global.fetch.mockRejectedValue(new Error('offline'));
        const received = [];
        manager.subscribe(URL_A, { update: (type) => received.push(type) });

        await expect(
            manager.fetch(URL_A, { maxRetries: 0 })
        ).rejects.toThrow();

        expect(received).toContain('error');
    });

    it('stops event delivery after unsubscribe', async () => {
        const received = [];
        const observer = { update: (type) => received.push(type) };
        manager.subscribe(URL_A, observer);

        // First fetch — observer active
        await manager.fetch(URL_A);
        const countAfterFirst = received.length;
        expect(countAfterFirst).toBeGreaterThan(0);

        manager.unsubscribe(URL_A, observer);
        global.fetch.mockResolvedValue(makeMockResponse(DATA_A));

        // Invalidate cache so second fetch goes to network
        manager.globalCache.clear();
        await manager.fetch(URL_A);
        expect(received.length).toBe(countAfterFirst); // no new events
    });
});
