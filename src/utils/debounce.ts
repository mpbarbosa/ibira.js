/**
 * @fileoverview Debounce higher-order function — delays execution until activity stops
 * @module utils/debounce
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */

/**
 * A debounced function with additional control methods.
 *
 * @template TArgs - Tuple of argument types of the wrapped function
 * @template TReturn - Return type of the wrapped function
 */
export interface DebouncedFunction<TArgs extends unknown[], TReturn> {
	/**
	 * Resets the wait timer. All callers in the current window share the same Promise,
	 * which resolves (or rejects) once the trailing-edge invocation completes.
	 */
	(...args: TArgs): Promise<TReturn>;
	/**
	 * Cancels the pending invocation. All Promises already returned by this debounced
	 * function will remain pending indefinitely — callers should check `cancel()` is
	 * appropriate before calling it.
	 */
	cancel(): void;
	/**
	 * Forces the debounced function to execute immediately with the most recently supplied
	 * arguments, resolving all pending Promises. No-op when there is no pending invocation.
	 */
	flush(): void;
}

/**
 * Creates a debounced version of `fn` that delays invocation until `wait` milliseconds
 * have elapsed since the **last** call (trailing-edge strategy).
 *
 * All calls made within the same wait window share a single Promise: when the debounced
 * function eventually fires, every caller's Promise resolves (or rejects) with the same
 * result. This makes it safe to `await` the debounced function in multiple places.
 *
 * @template TArgs - Tuple of argument types of the wrapped function
 * @template TReturn - Return type of the wrapped function
 *
 * @param {(...args: TArgs) => TReturn | Promise<TReturn>} fn - The function to debounce
 * @param {number} wait - Milliseconds to wait after the last call before executing (must be ≥ 0)
 * @returns {DebouncedFunction<TArgs, TReturn>} Debounced wrapper with `cancel()` and `flush()` methods
 *
 * @throws {TypeError} When `fn` is not a function or `wait` is not a non-negative number
 *
 * @example
 * // Search-as-you-type: fetch only after the user stops typing for 300 ms
 * import { IbiraAPIFetcher } from 'ibira.js';
 * import { debounce } from 'ibira.js/utils';
 *
 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/search');
 * const debouncedFetch = debounce(fetcher.fetchData.bind(fetcher), 300);
 *
 * searchInput.addEventListener('input', async () => {
 *   const results = await debouncedFetch(); // only the final keystroke triggers a request
 *   renderResults(results);
 * });
 *
 * @example
 * // Cancel a pending request before navigation
 * window.addEventListener('beforeunload', () => debouncedFetch.cancel());
 *
 * @example
 * // Force immediate execution regardless of the wait timer
 * submitButton.addEventListener('click', () => debouncedFetch.flush());
 *
 * @since 0.4.20-alpha
 */
export function debounce<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => TReturn | Promise<TReturn>,
	wait: number,
): DebouncedFunction<TArgs, TReturn> {
	if (typeof fn !== 'function') {
		throw new TypeError('debounce: first argument must be a function');
	}
	if (typeof wait !== 'number' || wait < 0 || !isFinite(wait)) {
		throw new TypeError('debounce: wait must be a non-negative finite number');
	}

	let timer: ReturnType<typeof setTimeout> | null = null;
	let latestArgs: TArgs | null = null;
	let pending: Array<{
		resolve: (value: TReturn) => void;
		reject: (reason: unknown) => void;
	}> = [];

	const execute = async (): Promise<void> => {
		timer = null;
		const args = latestArgs!;
		latestArgs = null;
		const callbacks = pending.splice(0);
		try {
			const result = await fn(...args);
			callbacks.forEach(cb => cb.resolve(result as TReturn));
		} catch (error) {
			callbacks.forEach(cb => cb.reject(error));
		}
	};

	const debounced = (...args: TArgs): Promise<TReturn> => {
		latestArgs = args;
		if (timer !== null) {
			clearTimeout(timer);
		}
		return new Promise<TReturn>((resolve, reject) => {
			pending.push({ resolve, reject });
			timer = setTimeout(() => void execute(), wait);
		});
	};

	debounced.cancel = (): void => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		latestArgs = null;
		pending = [];
	};

	debounced.flush = (): void => {
		if (timer !== null) {
			clearTimeout(timer);
			void execute();
		}
	};

	return debounced;
}
