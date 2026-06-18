/**
 * @fileoverview Typed error thrown when a circuit breaker blocks a request
 * @module resilience/CircuitOpenError
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */

/**
 * Thrown by `CircuitBreakerManager` when the circuit is open and no fallback
 * is configured. Carries enough context for callers to surface a meaningful
 * message or implement back-pressure.
 *
 * @example
 * try {
 *   await cbManager.fetch(url);
 * } catch (err) {
 *   if (err instanceof CircuitOpenError) {
 *     console.log(`Retry after ${new Date(err.retryAfter).toISOString()}`);
 *   }
 * }
 */
export class CircuitOpenError extends Error {
	/** The URL whose circuit is open. */
	readonly url: string;

	/**
	 * Timestamp (ms since epoch) at which the breaker transitions to half-open
	 * and a probe may be attempted.
	 */
	readonly retryAfter: number;

	constructor(url: string, retryAfter: number) {
		super(`Circuit breaker open for ${url}. Retry after ${new Date(retryAfter).toISOString()}`);
		this.name = 'CircuitOpenError';
		this.url = url;
		this.retryAfter = retryAfter;
		// Restore the prototype chain so instanceof works after transpilation.
		Object.setPrototypeOf(this, CircuitOpenError.prototype);
	}
}
