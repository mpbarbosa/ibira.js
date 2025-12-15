// DefaultCache.js
// Default cache implementation with expiration and size limits
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

/**
 * Default cache implementation for IbiraAPIFetcher
 * Provides basic Map-based caching with expiration and size limits
 */
export class DefaultCache {
	constructor(options = {}) {
		this.storage = new Map();
		this.maxSize = options.maxSize || 50;
		this.expiration = options.expiration || 300000; // 5 minutes
	}

	has(key) {
		return this.storage.has(key);
	}

	get(key) {
		return this.storage.get(key);
	}

	set(key, value) {
		this.storage.set(key, value);
		this._enforceSizeLimit();
	}

	delete(key) {
		return this.storage.delete(key);
	}

	clear() {
		this.storage.clear();
	}

	get size() {
		return this.storage.size;
	}

	entries() {
		return this.storage.entries();
	}

	_enforceSizeLimit() {
		if (this.storage.size <= this.maxSize) {
			return;
		}

		const entries = Array.from(this.storage.entries());
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		const entriesToRemove = this.storage.size - this.maxSize;
		for (let i = 0; i < entriesToRemove; i++) {
			this.storage.delete(entries[i][0]);
		}
	}
}
