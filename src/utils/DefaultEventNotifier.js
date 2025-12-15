// DefaultEventNotifier.js
// Default event notification system with observer pattern
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

/**
 * Default event notification system for IbiraAPIFetcher
 * Provides backward compatibility with the observer pattern while enabling external management
 */
export class DefaultEventNotifier {
	constructor() {
		this.observers = [];
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
		this.observers.forEach((observer) => {
			if (observer && typeof observer.update === 'function') {
				observer.update(...args);
			}
		});
	}

	clear() {
		this.observers = [];
	}

	get subscriberCount() {
		return this.observers.length;
	}
}
