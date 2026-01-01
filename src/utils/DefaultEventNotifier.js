/**
 * @fileoverview Default event notification system with observer pattern
 * @module utils/DefaultEventNotifier
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

/**
 * @typedef {Object} Observer
 * @property {Function} update - Method called with (eventType, payload) when events occur
 */

/**
 * DefaultEventNotifier - Observer pattern implementation for event notifications
 * 
 * Provides a simple observer pattern implementation that allows components to
 * subscribe to and receive notifications about fetcher events. This enables
 * reactive programming patterns and decoupled event handling.
 * 
 * **Supported Events:**
 * - 'loading-start': Fired when a fetch operation begins
 * - 'success': Fired when data is successfully fetched
 * - 'error': Fired when an error occurs during fetching
 * 
 * @class DefaultEventNotifier
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 * 
 * @example
 * const notifier = new DefaultEventNotifier();
 * 
 * notifier.subscribe({
 *   update: (event, data) => {
 *     console.log('Event:', event, 'Data:', data);
 *   }
 * });
 * 
 * notifier.notify('success', { result: 'data' });
 */
export class DefaultEventNotifier {
	/**
	 * Creates a new DefaultEventNotifier instance
	 * 
	 * @example
	 * const notifier = new DefaultEventNotifier();
	 */
	constructor() {
		this.observers = [];
	}

	/**
	 * Subscribes an observer to receive notifications
	 * 
	 * @param {Observer} observer - Observer object with an update method
	 * 
	 * @example
	 * notifier.subscribe({
	 *   update: (event, data) => {
	 *     if (event === 'loading-start') console.log('Loading...');
	 *     if (event === 'success') console.log('Data:', data);
	 *   }
	 * });
	 */
	subscribe(observer) {
		if (observer) {
			this.observers = [...this.observers, observer];
		}
	}

	/**
	 * Unsubscribes an observer from notifications
	 * 
	 * @param {Observer} observer - Observer object to remove
	 * 
	 * @example
	 * const observer = { update: (e, d) => console.log(e, d) };
	 * notifier.subscribe(observer);
	 * // Later...
	 * notifier.unsubscribe(observer);
	 */
	unsubscribe(observer) {
		this.observers = this.observers.filter((o) => o !== observer);
	}

	/**
	 * Notifies all subscribed observers with the provided arguments
	 * 
	 * @param {...*} args - Arguments to pass to each observer's update method
	 * 
	 * @example
	 * // Notify with event type and payload
	 * notifier.notify('success', { data: [1, 2, 3] });
	 * 
	 * @example
	 * // Notify with error
	 * notifier.notify('error', { error: new Error('Failed') });
	 */
	notify(...args) {
		this.observers.forEach((observer) => {
			if (observer && typeof observer.update === 'function') {
				observer.update(...args);
			}
		});
	}

	/**
	 * Clears all subscribed observers
	 * 
	 * @example
	 * notifier.clear();
	 * console.log('Subscribers:', notifier.subscriberCount); // 0
	 */
	clear() {
		this.observers = [];
	}

	/**
	 * Gets the current number of subscribed observers
	 * 
	 * @returns {number} The number of observers
	 * 
	 * @example
	 * console.log(`Active observers: ${notifier.subscriberCount}`);
	 */
	get subscriberCount() {
		return this.observers.length;
	}
}
