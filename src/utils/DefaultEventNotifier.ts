/**
 * @fileoverview Default event notification system with observer pattern
 * @module utils/DefaultEventNotifier
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

import { DualObserverSubject } from 'bessa_patterns.ts';

/**
 * @typedef {Object} Observer
 * @property {Function} update - Method called with (eventType, payload) when events occur
 */
export interface Observer {
	update: (...args: unknown[]) => void;
}

/**
 * DefaultEventNotifier - Observer pattern implementation for event notifications
 *
 * Built on top of {@link DualObserverSubject} from
 * [bessa_patterns.ts](https://github.com/mpbarbosa/bessa_patterns.ts)
 * (v0.12.13-alpha), which provides the immutable-array observer management,
 * null-safety, and per-observer error isolation.
 *
 * Wraps the `DualObserverSubject` GoF channel with the ibira.js-specific
 * `notify()` / `clear()` / `subscriberCount` surface so the rest of the
 * codebase stays unchanged.
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
	private readonly _subject: DualObserverSubject;

	/**
	 * Creates a new DefaultEventNotifier instance
	 *
	 * @example
	 * const notifier = new DefaultEventNotifier();
	 */
	constructor() {
		this._subject = new DualObserverSubject();
	}

	/**
	 * Read-only view of the currently subscribed observers.
	 *
	 * @type {ReadonlyArray<Observer>}
	 */
	get observers(): ReadonlyArray<Observer> {
		return this._subject.observers as ReadonlyArray<Observer>;
	}

	/**
	 * Subscribes an observer to receive notifications
	 *
	 * @param {Observer | null | undefined} observer - Observer object with an update method
	 *
	 * @example
	 * notifier.subscribe({
	 *   update: (event, data) => {
	 *     if (event === 'loading-start') console.log('Loading...');
	 *     if (event === 'success') console.log('Data:', data);
	 *   }
	 * });
	 */
	subscribe(observer: Observer | null | undefined): void {
		this._subject.subscribe(observer);
	}

	/**
	 * Unsubscribes an observer from notifications.
	 * Removes all occurrences if the same observer was subscribed multiple times.
	 *
	 * @param {Observer} observer - Observer object to remove
	 *
	 * @example
	 * const observer = { update: (e, d) => console.log(e, d) };
	 * notifier.subscribe(observer);
	 * // Later...
	 * notifier.unsubscribe(observer);
	 */
	unsubscribe(observer: Observer): void {
		this._subject.unsubscribe(observer);
	}

	/**
	 * Notifies all subscribed observers with the provided arguments.
	 * Observer errors are isolated — a throwing observer does not prevent
	 * subsequent observers from receiving the notification.
	 *
	 * @param {...unknown} args - Arguments to pass to each observer's update method
	 *
	 * @example
	 * // Notify with event type and payload
	 * notifier.notify('success', { data: [1, 2, 3] });
	 *
	 * @example
	 * // Notify with error
	 * notifier.notify('error', { error: new Error('Failed') });
	 */
	notify(...args: unknown[]): void {
		this._subject.notifyObservers(...args);
	}

	/**
	 * Clears all subscribed observers
	 *
	 * @example
	 * notifier.clear();
	 * console.log('Subscribers:', notifier.subscriberCount); // 0
	 */
	clear(): void {
		this._subject.clearAllObservers();
	}

	/**
	 * Gets the current number of subscribed observers
	 *
	 * @returns {number} The number of observers
	 *
	 * @example
	 * console.log(`Active observers: ${notifier.subscriberCount}`);
	 */
	get subscriberCount(): number {
		return this._subject.getObserverCount();
	}
}
