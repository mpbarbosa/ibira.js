/**
 * @fileoverview Circuit breaker state machine — pure class with no I/O
 * @module resilience/CircuitBreaker
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */

/** The three states a circuit breaker can be in. */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Configuration for a `CircuitBreaker` instance.
 *
 * All fields are optional and fall back to sensible defaults.
 */
export interface CircuitBreakerConfig {
	/** Consecutive failures before tripping open. Default: `5`. */
	failureThreshold?: number;
	/** Consecutive successes in half-open before closing. Default: `2`. */
	successThreshold?: number;
	/** Milliseconds to wait in open state before probing (half-open). Default: `60000`. */
	timeout?: number;
	/** Called whenever the state changes. Useful for metrics and logging. */
	onStateChange?: (from: CircuitState, to: CircuitState, url: string) => void;
}

/**
 * Pure state machine implementing the three-state circuit breaker pattern.
 *
 * ```text
 * CLOSED ──(N failures)──> OPEN
 *   ^                        |
 *   |                   (timeout)
 *   |                        v
 *   └──(M successes)── HALF-OPEN
 * ```
 *
 * This class is deliberately free of I/O and timers — it reads `Date.now()`
 * only inside `canAttempt()` to decide whether the timeout has elapsed.
 *
 * @example
 * const breaker = new CircuitBreaker('https://api.example.com', { failureThreshold: 3 });
 * if (breaker.canAttempt()) {
 *   try {
 *     const data = await fetch(...);
 *     breaker.recordSuccess();
 *   } catch (err) {
 *     breaker.recordFailure(err instanceof Error ? err : new Error(String(err)));
 *     throw err;
 *   }
 * }
 */
export class CircuitBreaker {
	private _state: CircuitState = 'closed';
	private _failureCount = 0;
	private _successCount = 0;
	private _nextRetryTime = 0;

	private readonly _url: string;
	private readonly _failureThreshold: number;
	private readonly _successThreshold: number;
	private readonly _timeout: number;
	private readonly _onStateChange: ((from: CircuitState, to: CircuitState, url: string) => void) | null;

	constructor(url: string, config: CircuitBreakerConfig = {}) {
		this._url = url;
		this._failureThreshold = config.failureThreshold ?? 5;
		this._successThreshold = config.successThreshold ?? 2;
		this._timeout = config.timeout ?? 60_000;
		this._onStateChange = config.onStateChange ?? null;
	}

	/**
	 * Returns `true` if a request should be allowed through.
	 *
	 * - **Closed**: always `true`
	 * - **Half-open**: always `true` (probe is in flight)
	 * - **Open**: `false`, unless the timeout has elapsed — in that case the
	 *   breaker transitions to half-open and returns `true`
	 */
	canAttempt(): boolean {
		if (this._state === 'closed' || this._state === 'half-open') {
			return true;
		}
		// state === 'open'
		if (Date.now() >= this._nextRetryTime) {
			this._transition('half-open');
			return true;
		}
		return false;
	}

	/**
	 * Records a successful response.
	 *
	 * - **Half-open**: increments `successCount`; if threshold reached, closes.
	 * - **Closed**: resets `failureCount` (streak broken).
	 * - **Open**: no-op (should not be called while open).
	 */
	recordSuccess(): void {
		if (this._state === 'half-open') {
			this._successCount++;
			if (this._successCount >= this._successThreshold) {
				this._failureCount = 0;
				this._successCount = 0;
				this._transition('closed');
			}
		} else if (this._state === 'closed') {
			this._failureCount = 0;
		}
	}

	/**
	 * Records a failed response.
	 *
	 * - **Closed**: increments `failureCount`; if threshold reached, opens.
	 * - **Half-open**: probe failed — reopens the circuit (resets `successCount`).
	 * - **Open**: no-op.
	 *
	 * @param _error - The error that occurred. Accepted for API symmetry and
	 *   future use (e.g., filtering certain error types).
	 */
	recordFailure(_error: Error): void {
		if (this._state === 'closed') {
			this._failureCount++;
			if (this._failureCount >= this._failureThreshold) {
				this._transition('open');
			}
		} else if (this._state === 'half-open') {
			this._successCount = 0;
			this._transition('open');
		}
	}

	/** Returns the current circuit state without triggering any transition. */
	getState(): CircuitState {
		return this._state;
	}

	/**
	 * Manually resets the breaker to closed with zeroed counters.
	 *
	 * Intended for administrative overrides (e.g., after a deployment or hotfix).
	 * Does **not** fire `onStateChange`.
	 */
	reset(): void {
		this._state = 'closed';
		this._failureCount = 0;
		this._successCount = 0;
		this._nextRetryTime = 0;
	}

	/** The URL this breaker is guarding. */
	get url(): string {
		return this._url;
	}

	/** Current consecutive failure count (informational). */
	get failureCount(): number {
		return this._failureCount;
	}

	/** Current consecutive success count in half-open (informational). */
	get successCount(): number {
		return this._successCount;
	}

	/**
	 * Timestamp (ms since epoch) at which the breaker will transition from
	 * open → half-open. `0` when not in the open state.
	 */
	get nextRetryTime(): number {
		return this._nextRetryTime;
	}

	private _transition(to: CircuitState): void {
		const from = this._state;
		if (from === to) return;
		if (to === 'open') {
			this._nextRetryTime = Date.now() + this._timeout;
			this._successCount = 0;
		} else if (to === 'half-open') {
			this._successCount = 0;
		} else {
			// closed
			this._nextRetryTime = 0;
		}
		this._state = to;
		this._onStateChange?.(from, to, this._url);
	}
}
