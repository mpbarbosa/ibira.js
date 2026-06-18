// __tests__/helpers.js
// Shared test utilities for the ibira.js test suite

/**
 * Creates a Map-based cache with the extra properties IbiraAPIFetcher expects
 * via its CacheInterface duck type.
 */
export function makeCache({ maxSize = 100, expiration = 5 * 60 * 1000 } = {}) {
	const cache = new Map();
	cache.maxSize = maxSize;
	cache.expiration = expiration;
	return cache;
}

/**
 * Creates a mock fetch Response object that resolves to `data` on `.json()`.
 */
export function makeMockResponse(data, { status = 200, ok = true } = {}) {
	return {
		ok,
		status,
		json: jest.fn().mockResolvedValue(data),
	};
}

/**
 * Spy-friendly event notifier for dependency injection in unit tests.
 * Records all notifications so tests can assert on them without needing
 * to subscribe a real observer.
 */
export class MockEventNotifier {
	constructor() {
		this.observers = [];
		this.notifications = [];
	}

	subscribe(observer) {
		if (observer) {
			this.observers = [...this.observers, observer];
		}
	}

	unsubscribe(observer) {
		this.observers = this.observers.filter((o) => o !== observer);
	}

	notify(...args) {
		this.notifications.push(args);
		this.observers.forEach((observer) => {
			if (observer && typeof observer.update === 'function') {
				observer.update(...args);
			}
		});
	}

	clear() {
		this.observers = [];
		this.notifications = [];
	}

	get subscriberCount() {
		return this.observers.length;
	}
}
