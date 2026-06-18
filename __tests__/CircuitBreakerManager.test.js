// @ts-check
'use strict';

import { CircuitBreakerManager } from '../src/resilience/CircuitBreakerManager.ts';
import { CircuitOpenError } from '../src/resilience/CircuitOpenError.ts';
import { IbiraAPIFetchManager } from '../src/core/IbiraAPIFetchManager.js';
import { makeMockResponse } from './helpers.js';

const URL_A = 'https://api.example.com/a';
const URL_B = 'https://api.example.com/b';

// Minimal mock of IbiraAPIFetchManager's interface used by CircuitBreakerManager
function makeMockInner(impl = () => Promise.resolve({ id: 1 })) {
	return {
		fetch: jest.fn().mockImplementation(impl),
		destroy: jest.fn(),
	};
}

// ─── CircuitOpenError ─────────────────────────────────────────────────────────

describe('CircuitOpenError', () => {
	test('is an instance of Error', () => {
		const err = new CircuitOpenError(URL_A, Date.now() + 60_000);
		expect(err).toBeInstanceOf(Error);
	});

	test('is an instance of CircuitOpenError', () => {
		const err = new CircuitOpenError(URL_A, Date.now() + 60_000);
		expect(err).toBeInstanceOf(CircuitOpenError);
	});

	test('name is CircuitOpenError', () => {
		const err = new CircuitOpenError(URL_A, 0);
		expect(err.name).toBe('CircuitOpenError');
	});

	test('url property carries the URL', () => {
		const err = new CircuitOpenError(URL_A, 0);
		expect(err.url).toBe(URL_A);
	});

	test('retryAfter property carries the timestamp', () => {
		const ts = Date.now() + 30_000;
		const err = new CircuitOpenError(URL_A, ts);
		expect(err.retryAfter).toBe(ts);
	});

	test('message contains the url', () => {
		const err = new CircuitOpenError(URL_A, 0);
		expect(err.message).toContain(URL_A);
	});
});

// ─── CircuitBreakerManager — happy path ──────────────────────────────────────

describe('CircuitBreakerManager — happy path', () => {
	test('returns data from inner fetch', async () => {
		const inner = makeMockInner(() => Promise.resolve({ value: 42 }));
		const manager = new CircuitBreakerManager(inner, {});
		const result = await manager.fetch(URL_A);
		expect(result).toEqual({ value: 42 });
	});

	test('delegates to inner.fetch with the same url and options', async () => {
		const inner = makeMockInner();
		const manager = new CircuitBreakerManager(inner, {});
		const opts = { method: 'GET' };
		await manager.fetch(URL_A, opts);
		expect(inner.fetch).toHaveBeenCalledWith(URL_A, opts);
	});

	test('circuit starts closed', () => {
		const manager = new CircuitBreakerManager(makeMockInner(), {});
		const breaker = manager.getBreakerForUrl(URL_A);
		expect(breaker.getState()).toBe('closed');
	});

	test('recordSuccess is called after a successful fetch', async () => {
		const inner = makeMockInner();
		const manager = new CircuitBreakerManager(inner, {});
		await manager.fetch(URL_A);
		const breaker = manager.getBreakerForUrl(URL_A);
		expect(breaker.failureCount).toBe(0);
	});
});

// ─── CircuitBreakerManager — failure path ────────────────────────────────────

describe('CircuitBreakerManager — failure path', () => {
	test('re-throws the error from inner fetch', async () => {
		const err = new Error('network fail');
		const inner = makeMockInner(() => Promise.reject(err));
		const manager = new CircuitBreakerManager(inner, {});
		await expect(manager.fetch(URL_A)).rejects.toThrow('network fail');
	});

	test('records failure on the circuit breaker', async () => {
		const inner = makeMockInner(() => Promise.reject(new Error('x')));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 5 });
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		expect(manager.getBreakerForUrl(URL_A).failureCount).toBe(1);
	});

	test('opens the circuit after N failures', async () => {
		const inner = makeMockInner(() => Promise.reject(new Error('x')));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 3 });
		for (let i = 0; i < 3; i++) {
			try { await manager.fetch(URL_A); } catch { /* expected */ }
		}
		expect(manager.getBreakerForUrl(URL_A).getState()).toBe('open');
	});

	test('non-Error rejections are wrapped in Error before recording', async () => {
		const inner = makeMockInner(() => Promise.reject('string error'));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 5 });
		await expect(manager.fetch(URL_A)).rejects.toBe('string error');
		expect(manager.getBreakerForUrl(URL_A).failureCount).toBe(1);
	});
});

// ─── CircuitBreakerManager — open circuit ────────────────────────────────────

describe('CircuitBreakerManager — open circuit', () => {
	function makeOpenManager(threshold = 3) {
		const inner = makeMockInner(() => Promise.reject(new Error('fail')));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: threshold });
		return { inner, manager };
	}

	async function openCircuit(manager, url = URL_A, threshold = 3) {
		for (let i = 0; i < threshold; i++) {
			try { await manager.fetch(url); } catch { /* expected */ }
		}
	}

	test('throws CircuitOpenError when circuit is open', async () => {
		const { manager } = makeOpenManager(3);
		await openCircuit(manager);
		await expect(manager.fetch(URL_A)).rejects.toBeInstanceOf(CircuitOpenError);
	});

	test('CircuitOpenError carries the correct url', async () => {
		const { manager } = makeOpenManager(3);
		await openCircuit(manager);
		const err = await manager.fetch(URL_A).catch((e) => e);
		expect(err.url).toBe(URL_A);
	});

	test('CircuitOpenError carries a future retryAfter timestamp', async () => {
		const before = Date.now();
		const { manager } = makeOpenManager(3);
		await openCircuit(manager);
		const err = await manager.fetch(URL_A).catch((e) => e);
		expect(err.retryAfter).toBeGreaterThan(before);
	});

	test('does not call inner.fetch when circuit is open', async () => {
		const { inner, manager } = makeOpenManager(3);
		await openCircuit(manager);
		inner.fetch.mockClear();
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		expect(inner.fetch).not.toHaveBeenCalled();
	});

	test('calls fallback(url) when circuit is open and fallback is provided', async () => {
		const fallback = jest.fn().mockReturnValue({ stale: true });
		const inner = makeMockInner(() => Promise.reject(new Error('fail')));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 2 }, fallback);
		for (let i = 0; i < 2; i++) {
			try { await manager.fetch(URL_A); } catch { /* expected */ }
		}
		const result = await manager.fetch(URL_A);
		expect(fallback).toHaveBeenCalledWith(URL_A);
		expect(result).toEqual({ stale: true });
	});

	test('fallback is called with the correct url', async () => {
		const fallback = jest.fn().mockReturnValue(null);
		const inner = makeMockInner(() => Promise.reject(new Error('fail')));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 1 }, fallback);
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		await manager.fetch(URL_A);
		expect(fallback).toHaveBeenCalledWith(URL_A);
	});
});

// ─── CircuitBreakerManager — per-URL isolation ───────────────────────────────

describe('CircuitBreakerManager — per-URL isolation', () => {
	test('failures on URL-A do not affect URL-B breaker', async () => {
		const inner = makeMockInner((url) =>
			url === URL_A ? Promise.reject(new Error('fail')) : Promise.resolve({ ok: true }),
		);
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 3 });
		for (let i = 0; i < 3; i++) {
			try { await manager.fetch(URL_A); } catch { /* expected */ }
		}
		// URL_A circuit is open; URL_B should still be closed and serve data
		expect(manager.getBreakerForUrl(URL_A).getState()).toBe('open');
		expect(manager.getBreakerForUrl(URL_B).getState()).toBe('closed');
		const result = await manager.fetch(URL_B);
		expect(result).toEqual({ ok: true });
	});

	test('each URL gets its own CircuitBreaker instance', () => {
		const manager = new CircuitBreakerManager(makeMockInner(), {});
		const breakerA = manager.getBreakerForUrl(URL_A);
		const breakerB = manager.getBreakerForUrl(URL_B);
		expect(breakerA).not.toBe(breakerB);
	});

	test('same URL always returns the same CircuitBreaker instance', () => {
		const manager = new CircuitBreakerManager(makeMockInner(), {});
		expect(manager.getBreakerForUrl(URL_A)).toBe(manager.getBreakerForUrl(URL_A));
	});
});

// ─── CircuitBreakerManager — recovery ────────────────────────────────────────

describe('CircuitBreakerManager — recovery after timeout', () => {
	test('allows fetch after timeout (half-open probe succeeds → closed)', async () => {
		jest.useFakeTimers();
		const inner = makeMockInner();
		inner.fetch
			.mockRejectedValueOnce(new Error('fail'))
			.mockRejectedValueOnce(new Error('fail'))
			.mockResolvedValue({ recovered: true });

		const manager = new CircuitBreakerManager(inner, {
			failureThreshold: 2,
			successThreshold: 1,
			timeout: 1000,
		});

		// Open the circuit
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		expect(manager.getBreakerForUrl(URL_A).getState()).toBe('open');

		// Advance past timeout → half-open
		jest.advanceTimersByTime(1001);

		// Probe succeeds → closed
		const result = await manager.fetch(URL_A);
		expect(result).toEqual({ recovered: true });
		expect(manager.getBreakerForUrl(URL_A).getState()).toBe('closed');

		jest.useRealTimers();
	});
});

// ─── CircuitBreakerManager — destroy ─────────────────────────────────────────

describe('CircuitBreakerManager — destroy()', () => {
	test('delegates destroy() to the inner manager', () => {
		const inner = makeMockInner();
		const manager = new CircuitBreakerManager(inner, {});
		manager.destroy();
		expect(inner.destroy).toHaveBeenCalledTimes(1);
	});
});

// ─── Integration: real IbiraAPIFetchManager with mocked global.fetch ─────────

describe('CircuitBreakerManager — integration with IbiraAPIFetchManager', () => {
	beforeEach(() => {
		global.fetch = jest.fn();
	});
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test('trips circuit after N real fetch failures', async () => {
		global.fetch.mockRejectedValue(new Error('network error'));
		const inner = new IbiraAPIFetchManager({ maxRetries: 0, cleanupStrategy: 'lazy' });
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 2 });

		try { await manager.fetch(URL_A); } catch { /* expected */ }
		try { await manager.fetch(URL_A); } catch { /* expected */ }

		expect(manager.getBreakerForUrl(URL_A).getState()).toBe('open');
		await expect(manager.fetch(URL_A)).rejects.toBeInstanceOf(CircuitOpenError);
		inner.destroy();
	});

	test('returns data and stays closed on successful real fetch', async () => {
		global.fetch.mockResolvedValue(makeMockResponse({ hello: 'world' }));
		const inner = new IbiraAPIFetchManager({ cleanupStrategy: 'lazy' });
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 3 });

		const result = await manager.fetch(URL_A);
		expect(result).toEqual({ hello: 'world' });
		expect(manager.getBreakerForUrl(URL_A).getState()).toBe('closed');
		inner.destroy();
	});
});

// ─── CircuitBreakerManager — observer events ─────────────────────────────────

describe('CircuitBreakerManager — observer events', () => {
	function makeObserver() {
		const calls = [];
		return {
			update: jest.fn((...args) => calls.push(args)),
			calls,
		};
	}

	function makeFailingManager(threshold = 3) {
		const inner = makeMockInner(() => Promise.reject(new Error('fail')));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: threshold, timeout: 1000 });
		return { inner, manager };
	}

	async function trip(manager, url = URL_A, threshold = 3) {
		for (let i = 0; i < threshold; i++) {
			try { await manager.fetch(url); } catch { /* expected */ }
		}
	}

	test('subscribe() / unsubscribe() / subscriberCount work', () => {
		const { manager } = makeFailingManager();
		const obs = makeObserver();
		expect(manager.subscriberCount).toBe(0);
		manager.subscribe(obs);
		expect(manager.subscriberCount).toBe(1);
		manager.unsubscribe(obs);
		expect(manager.subscriberCount).toBe(0);
	});

	test("emits 'breaker-open' when circuit trips", async () => {
		const { manager } = makeFailingManager(3);
		const obs = makeObserver();
		manager.subscribe(obs);
		await trip(manager, URL_A, 3);
		expect(obs.update).toHaveBeenCalledWith(
			'breaker-open',
			expect.objectContaining({ url: URL_A }),
		);
	});

	test("'breaker-open' payload has failureCount equal to threshold", async () => {
		const { manager } = makeFailingManager(3);
		const obs = makeObserver();
		manager.subscribe(obs);
		await trip(manager, URL_A, 3);
		const [, payload] = obs.calls.find(([event]) => event === 'breaker-open');
		expect(payload.failureCount).toBe(3);
	});

	test("'breaker-open' payload has a future retryAfter timestamp", async () => {
		const before = Date.now();
		const { manager } = makeFailingManager(2);
		const obs = makeObserver();
		manager.subscribe(obs);
		await trip(manager, URL_A, 2);
		const [, payload] = obs.calls.find(([event]) => event === 'breaker-open');
		expect(payload.retryAfter).toBeGreaterThan(before);
	});

	test("emits 'breaker-half-open' after timeout elapses", async () => {
		jest.useFakeTimers();
		const { manager } = makeFailingManager(2);
		const obs = makeObserver();
		manager.subscribe(obs);
		await trip(manager, URL_A, 2);
		obs.update.mockClear();
		obs.calls.length = 0;

		jest.advanceTimersByTime(1001);
		manager.getBreakerForUrl(URL_A).canAttempt(); // triggers open → half-open
		expect(obs.update).toHaveBeenCalledWith(
			'breaker-half-open',
			expect.objectContaining({ url: URL_A }),
		);
		jest.useRealTimers();
	});

	test("'breaker-half-open' payload has no retryAfter", async () => {
		jest.useFakeTimers();
		const { manager } = makeFailingManager(2);
		const obs = makeObserver();
		manager.subscribe(obs);
		await trip(manager, URL_A, 2);
		jest.advanceTimersByTime(1001);
		obs.calls.length = 0;
		manager.getBreakerForUrl(URL_A).canAttempt();
		const [, payload] = obs.calls.find(([event]) => event === 'breaker-half-open');
		expect(payload.retryAfter).toBeUndefined();
		jest.useRealTimers();
	});

	test("emits 'breaker-closed' when half-open probe succeeds", async () => {
		jest.useFakeTimers();
		const successData = { ok: true };
		const inner = makeMockInner();
		inner.fetch
			.mockRejectedValueOnce(new Error('x'))
			.mockRejectedValueOnce(new Error('x'))
			.mockResolvedValue(successData);
		const manager = new CircuitBreakerManager(inner, {
			failureThreshold: 2,
			successThreshold: 1,
			timeout: 1000,
		});
		const obs = makeObserver();
		manager.subscribe(obs);

		// Open the circuit
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		try { await manager.fetch(URL_A); } catch { /* expected */ }

		// Advance to half-open
		jest.advanceTimersByTime(1001);
		obs.calls.length = 0;

		// Successful probe → closed
		await manager.fetch(URL_A);
		expect(obs.update).toHaveBeenCalledWith(
			'breaker-closed',
			expect.objectContaining({ url: URL_A }),
		);
		jest.useRealTimers();
	});

	test("'breaker-closed' payload has failureCount 0", async () => {
		jest.useFakeTimers();
		const inner = makeMockInner();
		inner.fetch
			.mockRejectedValueOnce(new Error('x'))
			.mockRejectedValueOnce(new Error('x'))
			.mockResolvedValue({ ok: true });
		const manager = new CircuitBreakerManager(inner, {
			failureThreshold: 2,
			successThreshold: 1,
			timeout: 1000,
		});
		const obs = makeObserver();
		manager.subscribe(obs);
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		jest.advanceTimersByTime(1001);
		obs.calls.length = 0;
		await manager.fetch(URL_A);
		const [, payload] = obs.calls.find(([event]) => event === 'breaker-closed');
		expect(payload.failureCount).toBe(0);
		jest.useRealTimers();
	});

	test('observer added after first trip still receives future events', async () => {
		jest.useFakeTimers();
		const inner = makeMockInner();
		inner.fetch.mockRejectedValue(new Error('x'));
		const manager = new CircuitBreakerManager(inner, { failureThreshold: 2, timeout: 1000 });

		// Trip before subscribing
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		try { await manager.fetch(URL_A); } catch { /* expected */ }

		// Subscribe after trip
		const obs = makeObserver();
		manager.subscribe(obs);

		// Half-open probe fails → re-opens
		jest.advanceTimersByTime(1001);
		manager.getBreakerForUrl(URL_A).canAttempt(); // → half-open
		try { await manager.fetch(URL_A); } catch { /* expected */ }

		expect(obs.update).toHaveBeenCalledWith(
			'breaker-open',
			expect.objectContaining({ url: URL_A }),
		);
		jest.useRealTimers();
	});

	test('user-provided onStateChange is still called alongside events', async () => {
		const userCallback = jest.fn();
		const inner = makeMockInner(() => Promise.reject(new Error('x')));
		const manager = new CircuitBreakerManager(inner, {
			failureThreshold: 2,
			onStateChange: userCallback,
		});
		const obs = makeObserver();
		manager.subscribe(obs);
		try { await manager.fetch(URL_A); } catch { /* expected */ }
		try { await manager.fetch(URL_A); } catch { /* expected */ }

		// Both the notifier event and the user callback should have fired
		expect(obs.update).toHaveBeenCalledWith('breaker-open', expect.any(Object));
		expect(userCallback).toHaveBeenCalledWith('closed', 'open', URL_A);
	});
});
