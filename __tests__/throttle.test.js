// __tests__/throttle.test.js
// Unit tests for the throttle higher-order function

import { throttle } from '../src/utils/throttle.js';

describe('throttle', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	describe('argument validation', () => {
		test('should throw TypeError when fn is not a function', () => {
			expect(() => throttle(42, 100)).toThrow(TypeError);
			expect(() => throttle(null, 100)).toThrow(TypeError);
			expect(() => throttle('string', 100)).toThrow(TypeError);
		});

		test('should throw TypeError when wait is not a non-negative number', () => {
			const fn = jest.fn();
			expect(() => throttle(fn, -1)).toThrow(TypeError);
			expect(() => throttle(fn, NaN)).toThrow(TypeError);
			expect(() => throttle(fn, Infinity)).toThrow(TypeError);
			expect(() => throttle(fn, 'fast')).toThrow(TypeError);
		});

		test('should accept wait of 0', () => {
			const fn = jest.fn(() => 'ok');
			expect(() => throttle(fn, 0)).not.toThrow();
		});
	});

	describe('leading-edge execution', () => {
		test('should call fn immediately on the first invocation', () => {
			const fn = jest.fn(() => 'result');
			const throttled = throttle(fn, 500);

			const result = throttled('a');

			expect(fn).toHaveBeenCalledTimes(1);
			expect(fn).toHaveBeenCalledWith('a');
			expect(result).toBe('result');
		});

		test('should return undefined for calls made within the wait window', () => {
			const fn = jest.fn(() => 'result');
			const throttled = throttle(fn, 500);

			throttled();
			const dropped = throttled();

			expect(fn).toHaveBeenCalledTimes(1);
			expect(dropped).toBeUndefined();
		});

		test('should allow a second execution after the wait period has elapsed', () => {
			const fn = jest.fn(() => 'result');
			const throttled = throttle(fn, 500);

			throttled();
			jest.advanceTimersByTime(500);
			throttled();

			expect(fn).toHaveBeenCalledTimes(2);
		});

		test('should not execute while still within the wait window', () => {
			const fn = jest.fn();
			const throttled = throttle(fn, 1000);

			throttled();
			jest.advanceTimersByTime(999);
			throttled();

			expect(fn).toHaveBeenCalledTimes(1);
		});
	});

	describe('argument forwarding', () => {
		test('should forward all arguments to the wrapped function', () => {
			const fn = jest.fn((a, b, c) => a + b + c);
			const throttled = throttle(fn, 100);

			const result = throttled(1, 2, 3);

			expect(fn).toHaveBeenCalledWith(1, 2, 3);
			expect(result).toBe(6);
		});

		test('should work with async functions', async () => {
			const fn = jest.fn(async (x) => x * 2);
			const throttled = throttle(fn, 100);

			const promise = throttled(5);

			expect(promise).toBeInstanceOf(Promise);
			await expect(promise).resolves.toBe(10);
		});
	});

	describe('flush()', () => {
		test('should reset the cooldown so the next call executes immediately', () => {
			const fn = jest.fn(() => 'ok');
			const throttled = throttle(fn, 1000);

			throttled(); // executed — starts cooldown
			throttled(); // dropped — within cooldown

			throttled.flush();

			const result = throttled(); // should execute again immediately

			expect(fn).toHaveBeenCalledTimes(2);
			expect(result).toBe('ok');
		});
	});

	describe('integration with IbiraAPIFetcher.fetchData()', () => {
		test('should allow only one fetch per wait window', async () => {
			const mockFetch = jest.fn().mockResolvedValue('data');
			const throttledFetch = throttle(mockFetch, 500);

			throttledFetch();
			throttledFetch(); // dropped
			throttledFetch(); // dropped

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		test('should permit a new fetch after the wait window resets', async () => {
			const mockFetch = jest.fn().mockResolvedValue('data');
			const throttledFetch = throttle(mockFetch, 500);

			throttledFetch();
			jest.advanceTimersByTime(500);
			throttledFetch();

			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});
});
