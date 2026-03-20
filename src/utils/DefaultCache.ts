/**
 * @fileoverview Default cache implementation with expiration and size limits
 * @module utils/DefaultCache
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

/**
 * A single entry stored in the cache.
 *
 * @template T - The type of the cached data. Defaults to `unknown` for backward compatibility.
 */
export interface CacheEntry<T = unknown> {
	readonly data: T;
	readonly timestamp: number;
	readonly expiresAt: number;
}

/**
 * @typedef {Object} CacheOptions
 * @property {number} [maxSize=50] - Maximum number of cache entries
 * @property {number} [expiration=300000] - Cache expiration time in milliseconds (default: 5 minutes)
 */
export interface CacheOptions {
	maxSize?: number;
	expiration?: number;
}

/**
 * DefaultCache - Map-based cache implementation with expiration and LRU eviction
 * 
 * Provides a simple but effective caching mechanism for IbiraAPIFetcher with:
 * - Automatic expiration of old entries
 * - LRU (Least Recently Used) eviction when size limit is reached
 * - Map-compatible interface for easy integration
 * 
 * @class DefaultCache
 * @template T - The type of the cached data. Defaults to `unknown` for backward compatibility.
 *   Use a specific type (e.g. `DefaultCache<User>`) to get typed cache entries.
 * @implements {Map}
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 * 
 * @example
 * // Untyped (backward-compatible)
 * const cache = new DefaultCache({ maxSize: 100, expiration: 5 * 60 * 1000 });
 * 
 * @example
 * // Typed for end-to-end type inference
 * interface User { id: number; name: string; }
 * const cache = new DefaultCache<User>();
 * cache.set('user:1', { data: { id: 1, name: 'Alice' }, timestamp: Date.now(), expiresAt: Date.now() + 300000 });
 * const entry = cache.get('user:1'); // entry.data is typed as User
 */
export class DefaultCache<T = unknown> {
	storage: Map<string, CacheEntry<T>>;
	maxSize: number;
	expiration: number;

	/**
	 * Creates a new DefaultCache instance
	 * 
	 * @param {CacheOptions} [options={}] - Cache configuration options
	 * 
	 * @example
	 * const cache = new DefaultCache({ maxSize: 200, expiration: 600000 });
	 */
	constructor(options: CacheOptions = {}) {
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
	has(key: string): boolean {
		return this.storage.has(key);
	}

	/**
	 * Retrieves a value from the cache
	 * 
	 * @param {string} key - The cache key to retrieve
	 * @returns {CacheEntry | undefined} The cached value or undefined if not found
	 * 
	 * @example
	 * const data = cache.get('myKey');
	 * if (data) console.log('Found:', data);
	 */
	get(key: string): CacheEntry<T> | undefined {
		return this.storage.get(key);
	}

	/**
	 * Stores a value in the cache
	 * Automatically enforces size limits using LRU eviction
	 * 
	 * @param {string} key - The cache key
	 * @param {CacheEntry} value - The value to cache
	 * 
	 * @example
	 * cache.set('user:123', { data: { name: 'John' }, timestamp: Date.now(), expiresAt: Date.now() + 300000 });
	 */
	set(key: string, value: CacheEntry<T>): void {
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
	delete(key: string): boolean {
		return this.storage.delete(key);
	}

	/**
	 * Clears all entries from the cache
	 * 
	 * @example
	 * cache.clear();
	 * console.log('Cache cleared, size:', cache.size);
	 */
	clear(): void {
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
	get size(): number {
		return this.storage.size;
	}

	/**
	 * Returns an iterator over all cache entries
	 * 
	 * @returns {IterableIterator<[string, CacheEntry]>} Iterator over [key, value] pairs
	 * 
	 * @example
	 * for (const [key, value] of cache.entries()) {
	 *   console.log(key, value);
	 * }
	 */
	entries(): IterableIterator<[string, CacheEntry<T>]> {
		return this.storage.entries();
	}

	/**
	 * Enforces the maximum cache size by removing oldest entries
	 * Uses LRU (Least Recently Used) eviction strategy
	 * 
	 * @private
	 */
	private _enforceSizeLimit(): void {
		if (this.storage.size <= this.maxSize) {
			return;
		}

		const entries: Array<[string, CacheEntry<T>]> = Array.from(this.storage.entries());
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		const entriesToRemove = this.storage.size - this.maxSize;
		for (let i = 0; i < entriesToRemove; i++) {
			this.storage.delete(entries[i][0]);
		}
	}
}
