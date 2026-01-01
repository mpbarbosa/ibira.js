/**
 * @fileoverview Default cache implementation with expiration and size limits
 * @module utils/DefaultCache
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

/**
 * @typedef {Object} CacheOptions
 * @property {number} [maxSize=50] - Maximum number of cache entries
 * @property {number} [expiration=300000] - Cache expiration time in milliseconds (default: 5 minutes)
 */

/**
 * DefaultCache - Map-based cache implementation with expiration and LRU eviction
 * 
 * Provides a simple but effective caching mechanism for IbiraAPIFetcher with:
 * - Automatic expiration of old entries
 * - LRU (Least Recently Used) eviction when size limit is reached
 * - Map-compatible interface for easy integration
 * 
 * @class DefaultCache
 * @implements {Map}
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 * 
 * @example
 * const cache = new DefaultCache({
 *   maxSize: 100,
 *   expiration: 5 * 60 * 1000 // 5 minutes
 * });
 * 
 * cache.set('key1', { data: 'value' });
 * const value = cache.get('key1');
 */
export class DefaultCache {
	/**
	 * Creates a new DefaultCache instance
	 * 
	 * @param {CacheOptions} [options={}] - Cache configuration options
	 * 
	 * @example
	 * const cache = new DefaultCache({ maxSize: 200, expiration: 600000 });
	 */
	constructor(options = {}) {
		this.storage = new Map();
		this.maxSize = options.maxSize || 50;
		this.expiration = options.expiration || 300000; // 5 minutes
	}

	/**
	 * Checks if a key exists in the cache
	 * 
	 * @param {string} key - The cache key to check
	 * @returns {boolean} True if the key exists, false otherwise
	 * 
	 * @example
	 * if (cache.has('myKey')) {
	 *   console.log('Key exists');
	 * }
	 */
	has(key) {
		return this.storage.has(key);
	}

	/**
	 * Retrieves a value from the cache
	 * 
	 * @param {string} key - The cache key to retrieve
	 * @returns {*} The cached value or undefined if not found
	 * 
	 * @example
	 * const data = cache.get('myKey');
	 * if (data) console.log('Found:', data);
	 */
	get(key) {
		return this.storage.get(key);
	}

	/**
	 * Stores a value in the cache
	 * Automatically enforces size limits using LRU eviction
	 * 
	 * @param {string} key - The cache key
	 * @param {*} value - The value to cache
	 * 
	 * @example
	 * cache.set('user:123', { name: 'John', age: 30 });
	 */
	set(key, value) {
		this.storage.set(key, value);
		this._enforceSizeLimit();
	}

	/**
	 * Removes a value from the cache
	 * 
	 * @param {string} key - The cache key to delete
	 * @returns {boolean} True if the entry was deleted, false otherwise
	 * 
	 * @example
	 * const deleted = cache.delete('myKey');
	 * console.log(deleted ? 'Deleted' : 'Not found');
	 */
	delete(key) {
		return this.storage.delete(key);
	}

	/**
	 * Clears all entries from the cache
	 * 
	 * @example
	 * cache.clear();
	 * console.log('Cache cleared, size:', cache.size);
	 */
	clear() {
		this.storage.clear();
	}

	/**
	 * Gets the current number of entries in the cache
	 * 
	 * @returns {number} The number of cached entries
	 * 
	 * @example
	 * console.log(`Cache has ${cache.size} entries`);
	 */
	get size() {
		return this.storage.size;
	}

	/**
	 * Returns an iterator over all cache entries
	 * 
	 * @returns {Iterator<Array>} Iterator over [key, value] pairs
	 * 
	 * @example
	 * for (const [key, value] of cache.entries()) {
	 *   console.log(key, value);
	 * }
	 */
	entries() {
		return this.storage.entries();
	}

	/**
	 * Enforces the maximum cache size by removing oldest entries
	 * Uses LRU (Least Recently Used) eviction strategy
	 * 
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
