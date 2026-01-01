// DefaultCache.js
// Default cache implementation with expiration and size limits
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

/**
 * Default cache implementation for IbiraAPIFetcher
 * Provides basic Map-based caching with expiration and size limits
 */
export class DefaultCache {
	/**
	 * Creates a new DefaultCache instance
	 * @param {Object} options - Cache configuration options
	 * @param {number} [options.maxSize=50] - Maximum number of cache entries
	 * @param {number} [options.expiration=300000] - Cache expiration time in milliseconds (default: 5 minutes)
	 */
	constructor(options = {}) {
		this.storage = new Map();
		this.maxSize = options.maxSize || 50;
		this.expiration = options.expiration || 300000; // 5 minutes
	}

	/**
	 * Checks if a key exists in the cache
	 * @param {string} key - The cache key to check
	 * @returns {boolean} True if the key exists, false otherwise
	 */
	has(key) {
		return this.storage.has(key);
	}

	/**
	 * Retrieves a value from the cache
	 * @param {string} key - The cache key to retrieve
	 * @returns {*} The cached value or undefined if not found
	 */
	get(key) {
		return this.storage.get(key);
	}

	/**
	 * Stores a value in the cache
	 * @param {string} key - The cache key
	 * @param {*} value - The value to cache
	 */
	set(key, value) {
		this.storage.set(key, value);
		this._enforceSizeLimit();
	}

	/**
	 * Removes a value from the cache
	 * @param {string} key - The cache key to delete
	 * @returns {boolean} True if the entry was deleted, false otherwise
	 */
	delete(key) {
		return this.storage.delete(key);
	}

	/**
	 * Clears all entries from the cache
	 */
	clear() {
		this.storage.clear();
	}

	/**
	 * Gets the current number of entries in the cache
	 * @returns {number} The number of cached entries
	 */
	get size() {
		return this.storage.size;
	}

	/**
	 * Returns an iterator over all cache entries
	 * @returns {Iterator} Iterator over [key, value] pairs
	 */
	entries() {
		return this.storage.entries();
	}

	/**
	 * Enforces the maximum cache size by removing oldest entries
	 * @private
	 */
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
