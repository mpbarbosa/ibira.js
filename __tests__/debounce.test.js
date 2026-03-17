// __tests__/debounce.test.js
// Unit tests for the debounce higher-order function

import { debounce } from '../src/utils/debounce.js';

describe('debounce', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	describe('argument validation', () => {
		test('should throw TypeError when fn is not a function', () => {
			expect(() => debounce(42, 300)).toThrow(TypeError);
			expect(() => debounce(null, 300)).toThrow(TypeError);
			expect(() => debounce('string', 300)).toThrow(TypeError);
		});

		test('should throw TypeError when wait is invalid', () => {
			const fn = jest.fn();
			expect(() => debounce(fn, -1)).toThrow(TypeError);
			expect(() => debounce(fn, NaN)).toThrow(TypeError);
			expect(() => debounce(fn, Infinity)).toThrow(TypeError);
			expect(() => debounce(fn, 'slow')).toThrow(TypeError);
		});

		test('should accept wait of 0', () => {
			const fn = jest.fn(() => 'ok');
			expect(() => debounce(fn, 0)).not.toThrow();
		});
	});

	describe('trailing-edge execution', () => {
		test('should not call fn before the wait period has elapsed', () => {
			const fn = jest.fn(() => 'result');
			const debounced = debounce(fn, 300);

			debounced();
			jest.advanceTimersByTime(299);

			expect(fn).not.toHaveBeenCalled();
		});

		test('should call fn once after the wait period', async () => {
			const fn = jest.fn(() => 'result');
			const debounced = debounce(fn, 300);

			const promise = debounced();
			await jest.runAllTimersAsync();

			await expect(promise).resolves.toBe('result');
			expect(fn).toHaveBeenCalledTimes(1);
		});

		test('should reset the timer on each call within the window', async () => {
			const fn = jest.fn(() => 'result');
			const debounced = debounce(fn, 300);

			debounced();
			jest.advanceTimersByTime(200); // reset before first timer fires
			debounced();
			jest.advanceTimersByTime(200); // reset again
			const promise = debounced();
			await jest.runAllTimersAsync();

			expect(fn).toHaveBeenCalledTimes(1);
			await expect(promise).resolves.toBe('result');
		});

		test('should invoke fn with the most recent arguments', async () => {
			const fn = jest.fn((x) => x * 10);
			const debounced = debounce(fn, 300);

			debounced(1);
			debounced(2);
			const promise = debounced(3); // last call wins
			await jest.runAllTimersAsync();

			expect(fn).toHaveBeenCalledWith(3);
			await expect(promise).resolves.toBe(30);
		});
	});

	describe('shared Promise across callers in the same window', () => {
		test('should resolve all pending Promises with the same result', async () => {
			const fn = jest.fn(() => 'shared');
			const debounced = debounce(fn, 300);

			const p1 = debounced('a');
			const p2 = debounced('b');
			const p3 = debounced('c');
			await jest.runAllTimersAsync();

			const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
			expect(r1).toBe('shared');
			expect(r2).toBe('shared');
			expect(r3).toBe('shared');
			expect(fn).toHaveBeenCalledTimes(1);
		});

		test('should reject all pending Promises when fn throws', async () => {
			const fn = jest.fn(() => { throw new Error('oops'); });
			const debounced = debounce(fn, 300);

			const p1 = debounced();
			p1.catch(() => {});
			const p2 = debounced();
			p2.catch(() => {});
			await jest.runAllTimersAsync();

			await expect(p1).rejects.toThrow('oops');
			await expect(p2).rejects.toThrow('oops');
		});

		test('should reject all pending Promises when async fn rejects', async () => {
			const fn = jest.fn().mockRejectedValue(new Error('network'));
			const debounced = debounce(fn, 300);

			const p1 = debounced();
			p1.catch(() => {});
			const p2 = debounced();
			p2.catch(() => {});
			await jest.runAllTimersAsync();

			await expect(p1).rejects.toThrow('network');
			await expect(p2).rejects.toThrow('network');
		});
	});

	describe('async fn support', () => {
		test('should resolve with the value returned by an async fn', async () => {
			const fn = jest.fn(async (url) => ({ url, data: 42 }));
			const debounced = debounce(fn, 200);

			const promise = debounced('https://api.example.com');
			await jest.runAllTimersAsync();

			await expect(promise).resolves.toEqual({ url: 'https://api.example.com', data: 42 });
		});

		test('should handle multiple consecutive windows independently', async () => {
			const fn = jest.fn((n) => n * 2);
			const debounced = debounce(fn, 200);

			// First window
			const p1 = debounced(1);
			await jest.runAllTimersAsync();
			await expect(p1).resolves.toBe(2);

			// Second window — independent timer
			const p2 = debounced(5);
			await jest.runAllTimersAsync();
			await expect(p2).resolves.toBe(10);

			expect(fn).toHaveBeenCalledTimes(2);
		});
	});

	describe('cancel()', () => {
		test('should prevent the pending fn from executing', async () => {
			const fn = jest.fn(() => 'result');
			const debounced = debounce(fn, 300);

			debounced();
			debounced.cancel();
			await jest.runAllTimersAsync();

			expect(fn).not.toHaveBeenCalled();
		});

		test('should clear all pending callers', () => {
			const fn = jest.fn(() => 'result');
			const debounced = debounce(fn, 300);

			debounced();
			debounced();
			debounced.cancel();

			// No timers remaining
			expect(jest.getTimerCount()).toBe(0);
		});

		test('should allow new calls after cancel', async () => {
			const fn = jest.fn(() => 'fresh');
			const debounced = debounce(fn, 300);

			debounced();
			debounced.cancel();

			const promise = debounced(); // new call after cancel
			await jest.runAllTimersAsync();

			await expect(promise).resolves.toBe('fresh');
			expect(fn).toHaveBeenCalledTimes(1);
		});
	});

	describe('flush()', () => {
		test('should execute the pending fn immediately', async () => {
			const fn = jest.fn(() => 'immediate');
			const debounced = debounce(fn, 10000);

			const promise = debounced('x');
			debounced.flush(); // execute right now, no need to advance timers

			await expect(promise).resolves.toBe('immediate');
			expect(fn).toHaveBeenCalledWith('x');
		});

		test('should be a no-op when there is no pending invocation', () => {
			const fn = jest.fn(() => 'result');
			const debounced = debounce(fn, 300);

			expect(() => debounced.flush()).not.toThrow();
			expect(fn).not.toHaveBeenCalled();
		});
	});

	describe('integration with fetch-like workflows', () => {
		test('should only fire one request for rapid consecutive search queries', async () => {
			const mockFetch = jest.fn().mockResolvedValue({ results: [] });
			const debouncedSearch = debounce(mockFetch, 300);

			// Simulate rapid keystrokes
			debouncedSearch('j');
			debouncedSearch('ja');
			debouncedSearch('jav');
			const promise = debouncedSearch('java');
			await jest.runAllTimersAsync();

			await expect(promise).resolves.toEqual({ results: [] });
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith('java');
		});
	});
});
