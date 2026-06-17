// __tests__/e2e.test.js
// End-to-end tests: full fetch-cache-notify pipeline with no module mocking.
// Only global.fetch is replaced so these tests exercise real code paths end-to-end.

import { IbiraAPIFetcher, IbiraAPIFetchManager, DefaultEventNotifier } from '../src/index.js';
import { makeMockResponse } from './helpers.js';

global.fetch = jest.fn();

const ENDPOINT = 'https://api.example.com/items';
const PAYLOAD = [{ id: 1, title: 'First' }, { id: 2, title: 'Second' }];
const TTL = 2000; // 2-second cache expiry used in scenarios that need expiry

// ---------------------------------------------------------------------------
// Full fetch-cache-notify pipeline via IbiraAPIFetcher
// ---------------------------------------------------------------------------

describe('E2e: IbiraAPIFetcher — full fetch-cache-notify pipeline', () => {
    let notifier;
    let received;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.useFakeTimers();
        jest.clearAllMocks();
        notifier = new DefaultEventNotifier();
        received = [];
        notifier.subscribe({ update: (type, payload) => received.push({ type, payload }) });
        global.fetch.mockResolvedValue(makeMockResponse(PAYLOAD));
    });

    afterEach(() => {
        notifier.clear();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('first fetch hits the network, fires events, and caches the result', async () => {
        const fetcher = IbiraAPIFetcher.withDefaultCache(ENDPOINT, { eventNotifier: notifier });

        const data = await fetcher.fetchData();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(data).toEqual(PAYLOAD);
        expect(received.map((e) => e.type)).toEqual(['loading-start', 'success']);
        expect(received[1].payload).toEqual(PAYLOAD);
    });

    it('repeat fetch within TTL uses cache — no network call and no events', async () => {
        const fetcher = IbiraAPIFetcher.withDefaultCache(ENDPOINT, { eventNotifier: notifier });

        await fetcher.fetchData();         // network
        received.length = 0;               // reset

        const data = await fetcher.fetchData();  // cache hit

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(data).toEqual(PAYLOAD);
        expect(received).toHaveLength(0);
    });

    it('fetch after TTL expires goes back to the network and fires events again', async () => {
        const fetcher = IbiraAPIFetcher.withDefaultCache(ENDPOINT, {
            eventNotifier: notifier,
            cacheExpiration: TTL,
        });

        await fetcher.fetchData();     // first network fetch
        received.length = 0;

        jest.advanceTimersByTime(TTL + 1);

        await fetcher.fetchData();     // cache expired → second network fetch

        expect(global.fetch).toHaveBeenCalledTimes(2);
        const types = received.map((e) => e.type);
        expect(types).toContain('loading-start');
        expect(types).toContain('success');
    });

    it('network error fires loading-start then error and does not cache anything', async () => {
        global.fetch.mockRejectedValue(new Error('connection refused'));
        const fetcher = IbiraAPIFetcher.withDefaultCache(ENDPOINT, {
            eventNotifier: notifier,
            maxRetries: 0,
        });

        await expect(fetcher.fetchData()).rejects.toThrow('connection refused');

        const types = received.map((e) => e.type);
        expect(types[0]).toBe('loading-start');
        expect(types).toContain('error');

        // Cache must remain empty so the next call retries the network
        expect(fetcher.cache.size).toBe(0);
    });

    it('all subscribers receive the same events from a single fetch', async () => {
        const secondReceived = [];
        notifier.subscribe({ update: (type) => secondReceived.push(type) });

        const fetcher = IbiraAPIFetcher.withDefaultCache(ENDPOINT, { eventNotifier: notifier });
        await fetcher.fetchData();

        const firstTypes = received.map((e) => e.type);
        expect(firstTypes).toEqual(['loading-start', 'success']);
        expect(secondReceived).toEqual(['loading-start', 'success']);
    });

    it('retry on retryable error eventually succeeds and fires success', async () => {
        global.fetch
            .mockResolvedValueOnce(makeMockResponse(null, { ok: false, status: 503 }))
            .mockResolvedValueOnce(makeMockResponse(PAYLOAD));

        const fetcher = IbiraAPIFetcher.withDefaultCache(ENDPOINT, {
            eventNotifier: notifier,
            maxRetries: 1,
            retryDelay: 100,
        });

        const dataPromise = fetcher.fetchData();
        await jest.runAllTimersAsync();
        const data = await dataPromise;

        expect(data).toEqual(PAYLOAD);
        const types = received.map((e) => e.type);
        expect(types).toContain('success');
    });
});

// ---------------------------------------------------------------------------
// Full fetch-cache-notify pipeline via IbiraAPIFetchManager
// ---------------------------------------------------------------------------

describe('E2e: IbiraAPIFetchManager — full fetch-cache-notify pipeline', () => {
    let manager;

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.useFakeTimers();
        manager = new IbiraAPIFetchManager({ cacheExpiration: TTL });
        jest.clearAllMocks();
        global.fetch.mockResolvedValue(makeMockResponse(PAYLOAD));
    });

    afterEach(() => {
        manager.destroy();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('fetches, caches, and delivers events end-to-end', async () => {
        const received = [];
        manager.subscribe(ENDPOINT, { update: (type) => received.push(type) });

        const data = await manager.fetch(ENDPOINT);

        expect(data).toEqual(PAYLOAD);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(received).toContain('loading-start');
        expect(received).toContain('success');
    });

    it('deduplicates concurrent requests to the same endpoint', async () => {
        let resolveFirst;
        global.fetch.mockReturnValue(
            new Promise((resolve) => {
                resolveFirst = () => resolve(makeMockResponse(PAYLOAD));
            })
        );

        const [result1, result2] = await Promise.all([
            manager.fetch(ENDPOINT),
            manager.fetch(ENDPOINT),
        ].map((p) => {
            if (resolveFirst) { resolveFirst(); resolveFirst = null; }
            return p;
        }));

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result1).toEqual(PAYLOAD);
        expect(result2).toEqual(PAYLOAD);
    });

    it('serves a subsequent call from cache without hitting the network', async () => {
        await manager.fetch(ENDPOINT);
        const second = await manager.fetch(ENDPOINT);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(second).toEqual(PAYLOAD);
    });

    it('retries after cache expiry — network called again after TTL', async () => {
        await manager.fetch(ENDPOINT);
        jest.advanceTimersByTime(TTL + 1);

        global.fetch.mockResolvedValue(makeMockResponse(PAYLOAD));
        await manager.fetch(ENDPOINT);

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
