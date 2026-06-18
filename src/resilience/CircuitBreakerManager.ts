/**
 * @fileoverview Circuit-breaker wrapper around IbiraAPIFetchManager
 * @module resilience/CircuitBreakerManager
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */

import { IbiraAPIFetchManager } from '../core/IbiraAPIFetchManager.js';
import type { FetcherOptions } from '../core/IbiraAPIFetcher.js';
import { CircuitBreaker } from './CircuitBreaker.js';
import type { CircuitBreakerConfig } from './CircuitBreaker.js';
import { CircuitOpenError } from './CircuitOpenError.js';

export type { CircuitBreakerConfig };

/**
 * Thin wrapper around `IbiraAPIFetchManager` that adds per-URL circuit breaking.
 *
 * ```text
 * CircuitBreakerManager
 *   ├─> breakers: Map<url, CircuitBreaker>   // per-URL state machines
 *   └─> inner: IbiraAPIFetchManager          // fetch + cache + dedup layer
 * ```
 *
 * On each `fetch(url, options)` call the manager:
 * 1. Looks up (or lazily creates) the `CircuitBreaker` for that URL.
 * 2. If `!breaker.canAttempt()` — calls `fallback(url)` if provided, otherwise
 *    throws `CircuitOpenError`.
 * 3. Delegates to the inner manager's `fetch()`.
 * 4. Records success or failure on the breaker.
 * 5. Re-throws on failure after recording.
 *
 * @example
 * const inner = new IbiraAPIFetchManager({ maxCacheSize: 200 });
 * const manager = new CircuitBreakerManager(inner, { failureThreshold: 3 });
 *
 * const data = await manager.fetch('https://api.example.com/data');
 *
 * @example
 * // With a stale-cache fallback
 * const manager = new CircuitBreakerManager(inner, {}, (url) => staleCache.get(url));
 */
export class CircuitBreakerManager {
	private readonly _inner: IbiraAPIFetchManager;
	private readonly _breakers: Map<string, CircuitBreaker> = new Map();
	private readonly _config: CircuitBreakerConfig;
	private readonly _fallback: ((url: string) => unknown) | null;

	constructor(
		inner: IbiraAPIFetchManager,
		config: CircuitBreakerConfig = {},
		fallback?: (url: string) => unknown,
	) {
		this._inner = inner;
		this._config = config;
		this._fallback = fallback ?? null;
	}

	/**
	 * Fetches `url` through the circuit breaker.
	 *
	 * @throws {CircuitOpenError} When the circuit is open and no fallback is configured.
	 * @throws {Error} Any error thrown by the inner manager (re-thrown after recording failure).
	 */
	async fetch(url: string, options: FetcherOptions = {}): Promise<unknown> {
		const breaker = this._getOrCreateBreaker(url);

		if (!breaker.canAttempt()) {
			if (this._fallback !== null) {
				return this._fallback(url);
			}
			throw new CircuitOpenError(url, breaker.nextRetryTime);
		}

		try {
			const data = await this._inner.fetch(url, options);
			breaker.recordSuccess();
			return data;
		} catch (error) {
			breaker.recordFailure(error instanceof Error ? error : new Error(String(error)));
			throw error;
		}
	}

	/**
	 * Returns the `CircuitBreaker` instance for `url`, creating one if none exists.
	 *
	 * Useful for inspection and testing — do not mutate the returned breaker.
	 */
	getBreakerForUrl(url: string): CircuitBreaker {
		return this._getOrCreateBreaker(url);
	}

	/** Destroys the inner manager (stops timers, clears cache). */
	destroy(): void {
		this._inner.destroy();
	}

	private _getOrCreateBreaker(url: string): CircuitBreaker {
		let breaker = this._breakers.get(url);
		if (breaker === undefined) {
			breaker = new CircuitBreaker(url, this._config);
			this._breakers.set(url, breaker);
		}
		return breaker;
	}
}
