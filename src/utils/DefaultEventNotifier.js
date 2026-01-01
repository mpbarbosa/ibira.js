// DefaultEventNotifier.js
// Default event notification system with observer pattern
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

/**
 * Default event notification system for IbiraAPIFetcher
 * Provides backward compatibility with the observer pattern while enabling external management
 */
export class DefaultEventNotifier {
	/**
	 * Creates a new DefaultEventNotifier instance
	 */
	constructor() {
		this.observers = [];
	}

	/**
	 * Subscribes an observer to receive notifications
	 * @param {Object} observer - Observer object with an update method
	 */
	subscribe(observer) {
		if (observer) {
			this.observers = [...this.observers, observer];
		}
	}

	/**
	 * Unsubscribes an observer from notifications
	 * @param {Object} observer - Observer object to remove
	 */
	unsubscribe(observer) {
		this.observers = this.observers.filter((o) => o !== observer);
	}

	/**
	 * Notifies all subscribed observers with the provided arguments
	 * @param {...*} args - Arguments to pass to each observer's update method
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
	 */
	clear() {
		this.observers = [];
	}

	/**
	 * Gets the current number of subscribed observers
	 * @returns {number} The number of observers
	 */
	get subscriberCount() {
		return this.observers.length;
	}
}
