/**
 * @fileoverview Circuit-breaker wrapper around IbiraAPIFetchManager
 * @module resilience/CircuitBreakerManager
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */

import { IbiraAPIFetchManager } from '../core/IbiraAPIFetchManager.js';
import type { FetcherOptions } from '../core/IbiraAPIFetcher.js';
import { DefaultEventNotifier } from '../utils/DefaultEventNotifier.js';
import type { Observer } from '../utils/DefaultEventNotifier.js';
import { CircuitBreaker } from './CircuitBreaker.js';
import type { CircuitBreakerConfig, CircuitState } from './CircuitBreaker.js';
import { CircuitOpenError } from './CircuitOpenError.js';

export type { CircuitBreakerConfig };

/**
 * Payload carried by breaker state-transition events.
 *
 * | Event             | `retryAfter` present? |
 * | ----------------- | --------------------- |
 * | `'breaker-open'`  | yes                   |
 * | `'breaker-half-open'` | no               |
 * | `'breaker-closed'` | no                  |
 */
export interface BreakerEventPayload {
	url: string;
	failureCount: number;
	retryAfter?: number;
}

/**
 * Thin wrapper around `IbiraAPIFetchManager` that adds per-URL circuit breaking
 * and fires observer events on every state transition.
 *
 * ```text
 * CircuitBreakerManager
 *   ├─> breakers: Map<url, CircuitBreaker>   // per-URL state machines
 *   ├─> notifier: DefaultEventNotifier       // 'breaker-open' | '-half-open' | '-closed'
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
 * **State-transition events** are emitted through an internal
 * `DefaultEventNotifier`. Subscribe with `manager.subscribe(observer)`:
 *
 * ```ts
 * manager.subscribe({
 *   update(event: string, payload: BreakerEventPayload) {
 *     if (event === 'breaker-open') console.warn('Circuit open!', payload.retryAfter);
 *   }
 * });
 * ```
 *
 * @example
 * const inner = new IbiraAPIFetchManager({ maxCacheSize: 200 });
 * const manager = new CircuitBreakerManager(inner, { failureThreshold: 3 });
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
	private readonly _notifier: DefaultEventNotifier;

	constructor(
		inner: IbiraAPIFetchManager,
		config: CircuitBreakerConfig = {},
		fallback?: (url: string) => unknown,
	) {
		this._inner = inner;
		this._config = config;
		this._fallback = fallback ?? null;
		this._notifier = new DefaultEventNotifier();
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
	 * Subscribes an observer to receive breaker state-transition events.
	 *
	 * Events: `'breaker-open'`, `'breaker-half-open'`, `'breaker-closed'`.
	 * Each call passes `(eventName: string, payload: BreakerEventPayload)`.
	 */
	subscribe(observer: Observer): void {
		this._notifier.subscribe(observer);
	}

	/** Removes a previously subscribed observer. */
	unsubscribe(observer: Observer): void {
		this._notifier.unsubscribe(observer);
	}

	/** Number of currently subscribed observers. */
	get subscriberCount(): number {
		return this._notifier.subscriberCount;
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
			const userOnStateChange = this._config.onStateChange;
			const config: CircuitBreakerConfig = {
				...this._config,
				onStateChange: (from: CircuitState, to: CircuitState, breakerUrl: string) => {
					this._emitStateEvent(to, breakerUrl);
					userOnStateChange?.(from, to, breakerUrl);
				},
			};
			breaker = new CircuitBreaker(url, config);
			this._breakers.set(url, breaker);
		}
		return breaker;
	}

	private _emitStateEvent(to: CircuitState, url: string): void {
		const breaker = this._breakers.get(url);
		if (breaker === undefined) return;

		const payload: BreakerEventPayload = { url, failureCount: breaker.failureCount };
		if (to === 'open') {
			payload.retryAfter = breaker.nextRetryTime;
			this._notifier.notify('breaker-open', payload);
		} else if (to === 'half-open') {
			this._notifier.notify('breaker-half-open', payload);
		} else {
			this._notifier.notify('breaker-closed', payload);
		}
	}
}
