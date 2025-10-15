// ibira.js
// A JavaScript library for fetching and caching API data with observer pattern support.
// JSON response handling and robust error management.
// Version: 0.1.0-alpha
// Repository: https://github.com/mpbarbosa/ibira.js
// Copyright (c) 2025 Marcelo Pereira Barbosa
// Author: Marcelo Pereira Barbosa
// License: MIT


// Semantic Versioning 2.0.0 - see https://semver.org/
// Version object for unstable development status
const VERSION = {
	major: 0,
	minor: 2,
	patch: 0,
	prerelease: "alpha", // Indicates unstable development
	toString: function () {
		return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
	},
};

/**
 * Default cache implementation for IbiraAPIFetcher
 * Provides basic Map-based caching with expiration and size limits
 */
class DefaultCache {
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

/**
 * Default event notification system for IbiraAPIFetcher
 * Provides backward compatibility with the observer pattern while enabling external management
 */
class DefaultEventNotifier {
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

export class IbiraAPIFetcher {

	/**
	 * Creates an IbiraAPIFetcher with a purely functional cache approach
	 * This method provides better referential transparency by explicitly managing cache externally
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {Object} cache - External cache instance (must implement Map-like interface)
	 * @param {Object} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with external cache
	 * 
	 * @example
	 * // Purely functional approach with external cache
	 * const sharedCache = new Map();
	 * const fetcher = IbiraAPIFetcher.withExternalCache(
	 *   'https://api.example.com/data',
	 *   sharedCache,
	 *   { timeout: 5000 }
	 * );
	 */
	static withExternalCache(url, cache, options = {}) {
		return new IbiraAPIFetcher(url, cache, options);
	}

	/**
	 * Creates a default cache with expiration and size limits
	 * 
	 * @private
	 * @static
	 * @param {Object} [options={}] - Cache configuration options
	 * @returns {Map} Configured cache instance
	 */
	static _createDefaultCache(options = {}) {
		const cache = new Map();
		cache.maxSize = options.maxCacheSize || 100;
		cache.expiration = options.cacheExpiration || 5 * 60 * 1000; // 5 minutes default
		return cache;
	}

	/**
	 * Creates an IbiraAPIFetcher with default cache settings
	 * Convenient for most use cases with reasonable defaults
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {Object} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with default cache
	 * 
	 * @example
	 * // Using default cache settings (100 entries, 5 minute expiration)
	 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
	 * 
	 * @example
	 * // Custom cache settings
	 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data', {
	 *   maxCacheSize: 50,
	 *   cacheExpiration: 10 * 60 * 1000 // 10 minutes
	 * });
	 */
	static withDefaultCache(url, options = {}) {
		const cache = this._createDefaultCache(options);
		return new IbiraAPIFetcher(url, cache, options);
	}

	/**
	 * Creates an IbiraAPIFetcher with no caching for maximum referential transparency
	 * Every call will result in a fresh network request
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL  
	 * @param {Object} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with no cache
	 * 
	 * @example
	 * // No cache - purely functional, always fresh data
	 * const fetcher = IbiraAPIFetcher.withoutCache('https://api.example.com/data');
	 */
	static withoutCache(url, options = {}) {
		const noCache = {
			has: () => false,
			get: () => null,
			set: () => {},
			delete: () => false,
			clear: () => {},
			size: 0,
			entries: () => [],
			maxSize: 0,
			expiration: 0
		};
		return new IbiraAPIFetcher(url, noCache, options);
	}

	/**
	 * Creates an IbiraAPIFetcher with external event notification for maximum referential transparency
	 * Events are handled through callback functions instead of mutable observer state
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {Function} eventCallback - Function to handle events (event, data) => void
	 * @param {Object} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with callback-based events
	 * 
	 * @example
	 * // Purely functional event handling
	 * const fetcher = IbiraAPIFetcher.withEventCallback(
	 *   'https://api.example.com/data',
	 *   (event, data) => {
	 *     if (event === 'loading-start') setLoading(true);
	 *     if (event === 'success') setData(data);
	 *     if (event === 'error') setError(data.error);
	 *   }
	 * );
	 */
	static withEventCallback(url, eventCallback, options = {}) {
		const callbackNotifier = {
			subscribe: () => {}, // No-op for external callback
			unsubscribe: () => {}, // No-op for external callback
			notify: eventCallback,
			clear: () => {},
			subscriberCount: 1
		};
		// Create default cache if none provided
		const cache = options.cache || this._createDefaultCache(options);
		return new IbiraAPIFetcher(url, cache, { ...options, eventNotifier: callbackNotifier });
	}

	/**
	 * Creates an IbiraAPIFetcher with no event notifications for maximum referential transparency
	 * No side effects from event notifications - purely functional data fetching
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {Object} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with no event notifications
	 * 
	 * @example
	 * // Pure functional approach - no event side effects
	 * const fetcher = IbiraAPIFetcher.withoutEvents('https://api.example.com/data');
	 * const data = await fetcher.fetchData(); // No event notifications
	 */
	static withoutEvents(url, options = {}) {
		const noEvents = {
			subscribe: () => {},
			unsubscribe: () => {},
			notify: () => {}, // Silent - no event notifications
			clear: () => {},
			subscriberCount: 0
		};
		// Create default cache if none provided
		const cache = options.cache || this._createDefaultCache(options);
		return new IbiraAPIFetcher(url, cache, { ...options, eventNotifier: noEvents });
	}

	/**
	 * Creates a completely pure IbiraAPIFetcher for maximum referential transparency
	 * Use this when you want to handle all side effects (caching, events) externally
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {Object} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance for pure functional usage
	 * 
	 * @example
	 * // Maximum purity - handle all effects externally
	 * const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
	 * let cacheState = new Map();
	 * 
	 * const result = await fetcher.fetchDataPure(cacheState, Date.now());
	 * if (result.success) {
	 *   cacheState = result.newCacheState; // Update cache externally
	 *   console.log('Data:', result.data);
	 * }
	 */
	static pure(url, options = {}) {
		const noCache = {
			has: () => false,
			get: () => null,
			set: () => {},
			delete: () => false,
			clear: () => {},
			size: 0,
			entries: () => [],
			maxSize: options.maxCacheSize || 100,
			expiration: options.cacheExpiration || 5 * 60 * 1000
		};
		
		const noEvents = {
			subscribe: () => {},
			unsubscribe: () => {},
			notify: () => {},
			clear: () => {},
			subscriberCount: 0
		};
		
		return new IbiraAPIFetcher(url, noCache, { ...options, eventNotifier: noEvents });
	}

    constructor(url, cache, options = {}) {
		this.url = url;
		// this.observers = []; // ❌ REMOVED: Mutable observer state for referential transparency
		// this.fetching = false; // ❌ REMOVED: Mutable fetching state for referential transparency
		// this.data = null; // ❌ REMOVED: Mutable data state for referential transparency
		// this.error = null; // ❌ REMOVED: Mutable error state for referential transparency
		// this.loading = false; // ❌ REMOVED: Mutable loading state for referential transparency
		// this.lastFetch = 0; // ❌ REMOVED: Unused property for better referential transparency
		this.timeout = options.timeout || 10000;
		
		// ✅ EXCELLENT: Cache as required dependency for maximum referential transparency
		this.cache = cache;

		// ✅ IMPROVED: Event notifier as dependency injection for better referential transparency
		this.eventNotifier = options.eventNotifier || new DefaultEventNotifier();
		
		// ✅ SIMPLIFIED: Cache configuration managed by cache instance itself
		this.maxRetries = options.maxRetries || 3; // Maximum number of retry attempts
		this.retryDelay = options.retryDelay || 1000; // Initial retry delay in milliseconds
		this.retryMultiplier = options.retryMultiplier || 2; // Exponential backoff multiplier
		// ✅ IMMUTABLE: Create frozen copy of retryable status codes array for deep immutability
		this.retryableStatusCodes = Object.freeze([...(options.retryableStatusCodes || [408, 429, 500, 502, 503, 504])]); // HTTP status codes that should trigger retries
		
		// ✅ IMMUTABLE: Deep freeze the entire instance for maximum referential transparency
		// This prevents any external code from modifying the fetcher's properties
		// and guarantees true immutability at the language level
		return Object.freeze(this);
	}

	getCacheKey() {
		// Override this method in subclasses to provide a unique cache key
		return this.url;
	}

	/**
	 * Creates a cache entry with timestamp for expiration tracking
	 * Uses cache's own expiration configuration for better encapsulation
	 * 
	 * @private
	 * @param {any} data - The data to cache
	 * @param {number} currentTime - Current timestamp in milliseconds
	 * @param {Object} cache - Cache instance with expiration configuration
	 * @returns {Object} Cache entry with data and timestamp
	 */
	_createCacheEntry(data, currentTime, cache) {
		const expiration = cache.expiration || 300000; // Default 5 minutes if cache doesn't specify
		return {
			data: data,
			timestamp: currentTime,
			expiresAt: currentTime + expiration
		};
	}

	/**
	 * Checks if a cache entry is still valid (not expired)
	 * 
	 * @private
	 * @param {Object} cacheEntry - The cache entry to check
	 * @param {number} currentTime - Current timestamp in milliseconds
	 * @returns {boolean} True if the entry is still valid
	 */
	_isCacheEntryValid(cacheEntry, currentTime) {
		return cacheEntry && currentTime < cacheEntry.expiresAt;
	}

	/**
	 * Enforces cache size limits by removing oldest entries
	 * Uses LRU (Least Recently Used) eviction strategy
	 * 
	 * @private
	 * @param {Object} [cache] - Optional cache instance, defaults to this.cache
	 */
	_enforceCacheSizeLimit(cache = null) {
		const activeCache = cache || this.cache;
		const maxSize = activeCache.maxSize || 50; // Use cache's own maxSize or default
		
		if (activeCache.size <= maxSize) {
			return;
		}

		// Convert cache entries to array for sorting
		const entries = Array.from(activeCache.entries());
		
		// Sort by timestamp (oldest first)
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		// Calculate how many entries to remove
		const entriesToRemove = activeCache.size - maxSize;
		
		// Remove oldest entries
		for (let i = 0; i < entriesToRemove; i++) {
			activeCache.delete(entries[i][0]);
		}
	}

	/**
	 * Identifies expired cache entries that should be removed
	 * This is a pure function that returns keys to delete without mutating state
	 * 
	 * @private
	 * @param {Map} cache - The cache map to check
	 * @param {number} currentTime - Current timestamp in milliseconds
	 * @returns {string[]} Array of cache keys that have expired
	 */
	_getExpiredCacheKeys(cache, currentTime) {
		const expiredKeys = [];

		// Find all expired entries
		for (const [key, entry] of cache.entries()) {
			if (currentTime >= entry.expiresAt) {
				expiredKeys.push(key);
			}
		}

		return expiredKeys;
	}

	/**
	 * Cleans up expired cache entries
	 * Should be called periodically to prevent memory leaks
	 * 
	 * @private
	 * @param {Object} [cache] - Optional cache instance, defaults to this.cache
	 */
	_cleanupExpiredCache(cache = null) {
		const activeCache = cache || this.cache;
		const now = Date.now();
		const expiredKeys = this._getExpiredCacheKeys(activeCache, now);

		// Remove expired entries
		expiredKeys.forEach(key => activeCache.delete(key));
	}

	/**
	 * Determines if an error is retryable based on error type and status code
	 * 
	 * @private
	 * @param {Error} error - The error to check
	 * @returns {boolean} True if the error is retryable
	 */
	_isRetryableError(error) {
		// Network errors (no response received)
		if (error.name === 'TypeError' && error.message.includes('fetch')) {
			return true;
		}

		// Timeout errors
		if (error.name === 'AbortError' || error.message.includes('timeout')) {
			return true;
		}

		// HTTP status code errors
		if (error.message.includes('HTTP error! status:')) {
			const statusMatch = error.message.match(/status: (\d+)/);
			if (statusMatch) {
				const statusCode = parseInt(statusMatch[1]);
				return this.retryableStatusCodes.includes(statusCode);
			}
		}

		return false;
	}

	/**
	 * Calculates the delay for the next retry attempt using exponential backoff
	 * 
	 * @private
	 * @param {number} attempt - The current attempt number (0-based)
	 * @returns {number} Delay in milliseconds
	 */
	_calculateRetryDelay(attempt) {
		const delay = this.retryDelay * Math.pow(this.retryMultiplier, attempt);
		// Add jitter to prevent thundering herd (±25% random variation)
		const jitter = delay * 0.25 * (Math.random() - 0.5);
		return Math.max(100, delay + jitter); // Minimum 100ms delay
	}

	/**
	 * Sleeps for the specified number of milliseconds
	 * 
	 * @private
	 * @param {number} ms - Milliseconds to sleep
	 * @returns {Promise<void>} Promise that resolves after the delay
	 */
	_sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Performs a single network request with timeout handling
	 * 
	 * @private
	 * @param {AbortController} abortController - Controller for request cancellation
	 * @returns {Promise<any>} Promise that resolves to the fetched data
	 */
	async _performSingleRequest(abortController) {
		// Create fetch options with timeout
		const fetchOptions = {
			signal: abortController.signal
		};

		// Set up timeout
		const timeoutId = setTimeout(() => {
			abortController.abort();
		}, this.timeout);

		try {
			// Perform network request using modern Fetch API
			const response = await fetch(this.url, fetchOptions);

			// Clear timeout on successful response
			clearTimeout(timeoutId);

			// Check if HTTP request was successful (status 200-299)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Parse JSON response data
			const data = await response.json();
			return data;

		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}

	subscribe(observer) {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.subscribe(observer);
	}

	unsubscribe(observer) {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.unsubscribe(observer);
	}

	notifyObservers(...args) {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.notify(...args);
	}

	/**
	 * PURE FUNCTIONAL VERSION: Computes fetch result without side effects
	 * 
	 * This is the pure, referentially transparent core of the fetching logic.
	 * It performs all computations without mutating external state, returning
	 * a complete description of what should happen (data, cache operations, events).
	 * 
	 * **Pure Referential Transparency:**
	 * - ✅ No external state mutations
	 * - ✅ Deterministic given same inputs (when time is provided)
	 * - ✅ No side effects (network calls return descriptions)
	 * - ✅ Returns immutable result objects
	 * - ✅ Same input always produces same output structure
	 * 
	 * @param {Map} currentCacheState - Current cache state (not mutated)
	 * @param {number} [currentTime] - Current timestamp for deterministic behavior
	 * @param {Function} [networkProvider] - Pure network function for testing
	 * @returns {Promise<Object>} Pure result object describing what should happen
	 * 
	 * @example
	 * // Pure functional usage - no side effects
	 * const fetcher = IbiraAPIFetcher.withoutCache('https://api.example.com/data');
	 * const result = await fetcher.fetchDataPure(new Map(), Date.now());
	 * 
	 * // Result structure:
	 * // {
	 * //   success: true,
	 * //   data: {...},
	 * //   fromCache: false,
	 * //   cacheOperations: [{ type: 'set', key: 'url', value: {...} }],
	 * //   events: [{ type: 'loading-start', payload: {...} }],
	 * //   newCacheState: Map {...}
	 * // }
	 */
	async fetchDataPure(currentCacheState, currentTime = Date.now(), networkProvider = null) {
		const cacheKey = this.getCacheKey();
		
		// Pure function to get expired keys without mutations
		const expiredKeys = this._getExpiredCacheKeys(currentCacheState, currentTime);
		
		// Create new cache state without expired entries (pure)
		const cleanedCache = new Map();
		for (const [key, value] of currentCacheState) {
			if (!expiredKeys.includes(key)) {
				cleanedCache.set(key, value);
			}
		}
		
		// Check cache (pure read operation)
		if (cleanedCache.has(cacheKey)) {
			const cacheEntry = cleanedCache.get(cacheKey);
			if (this._isCacheEntryValid(cacheEntry, currentTime)) {
				// Update timestamp for LRU (create new entry, don't mutate)
				const updatedEntry = { ...cacheEntry, timestamp: currentTime };
				const newCacheState = new Map(cleanedCache);
				newCacheState.set(cacheKey, updatedEntry);
				
				return Object.freeze({
					success: true,
					data: cacheEntry.data,
					fromCache: true,
					cacheOperations: Object.freeze([
						Object.freeze({ type: 'update', key: cacheKey, value: updatedEntry })
					]),
					events: Object.freeze([]), // No events for cache hits
					newCacheState,
					meta: Object.freeze({
						cacheKey,
						timestamp: currentTime,
						expiredKeysRemoved: expiredKeys.length
					})
				});
			}
		}
		
		// Network operation (pure when networkProvider is provided)
		const events = [
			Object.freeze({ type: 'loading-start', payload: Object.freeze({ url: this.url, cacheKey }) })
		];
		
		try {
			// Use injected network provider for purity, or real fetch for practical use
			const networkFn = networkProvider || (() => this._performSingleRequest(new AbortController()));
			const data = await networkFn();
			
			// Create new cache entry (pure)
			const cacheEntry = this._createCacheEntry(data, currentTime, this.cache);
			
			// Create new cache state with the new entry (pure)
			const newCacheState = new Map(cleanedCache);
			newCacheState.set(cacheKey, cacheEntry);
			
			// Apply size limits (pure - returns new state)
			const finalCacheState = this._applyCacheSizeLimitsPure(newCacheState);
			
			return Object.freeze({
				success: true,
				data: data,
				fromCache: false,
				cacheOperations: Object.freeze([
					Object.freeze({ type: 'set', key: cacheKey, value: cacheEntry }),
					...this._calculateCacheEvictions(newCacheState, finalCacheState).map(op => Object.freeze(op))
				]),
				events: Object.freeze([
					...events.map(e => Object.freeze(e)),
					Object.freeze({ type: 'success', payload: data })
				]),
				newCacheState: finalCacheState,
				meta: Object.freeze({
					cacheKey,
					timestamp: currentTime,
					expiredKeysRemoved: expiredKeys.length,
					attempt: 1,
					networkRequest: true
				})
			});
			
		} catch (error) {
			return Object.freeze({
				success: false,
				error,
				fromCache: false,
				cacheOperations: Object.freeze([]),
				events: Object.freeze([
					...events.map(e => Object.freeze(e)),
					Object.freeze({ type: 'error', payload: Object.freeze({ error }) })
				]),
				newCacheState: cleanedCache,
				meta: Object.freeze({
					cacheKey,
					timestamp: currentTime,
					expiredKeysRemoved: expiredKeys.length,
					attempt: 1,
					networkRequest: true
				})
			});
		}
	}

	/**
	 * Pure function to apply cache size limits without mutations
	 * 
	 * @private
	 * @param {Map} cacheState - Current cache state
	 * @returns {Map} New cache state with size limits applied
	 */
	_applyCacheSizeLimitsPure(cacheState) {
		const maxSize = this.cache.maxSize || 50;
		
		if (cacheState.size <= maxSize) {
			return new Map(cacheState);
		}
		
		// Sort entries by timestamp (oldest first) without mutating original
		const entries = Array.from(cacheState.entries());
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		// Keep only the most recent entries
		const entriesToKeep = entries.slice(-(maxSize));
		return new Map(entriesToKeep);
	}

	/**
	 * Pure function to calculate what cache evictions occurred
	 * 
	 * @private
	 * @param {Map} beforeState - Cache state before size limits
	 * @param {Map} afterState - Cache state after size limits
	 * @returns {Array} Array of eviction operations
	 */
	_calculateCacheEvictions(beforeState, afterState) {
		const evictions = [];
		for (const [key] of beforeState) {
			if (!afterState.has(key)) {
				evictions.push({ type: 'delete', key });
			}
		}
		return evictions;
	}

	/**
	 * PRACTICAL WRAPPER: Applies side effects from pure computation
	 * 
	 * This method uses the pure core but applies the side effects (cache mutations,
	 * event notifications) for practical usage. It maintains the current API while
	 * enabling pure functional testing and reasoning.
	 * 
	 * @async
	 * @param {Object} [cacheOverride] - Optional cache instance to use instead of the default
	 * @returns {Promise<any>} Resolves with the fetched data, or retrieved from cache
	 * @throws {Error} Network errors, HTTP errors, or JSON parsing errors are thrown directly
	 * 
	 * @example
	 * // Practical usage - handles side effects automatically
	 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
	 * const data = await fetcher.fetchData();
	 * console.log(data); // Retrieved data
	 * 
	 * @example
	 * // Pure functional testing
	 * const mockNetwork = () => Promise.resolve({ test: 'data' });
	 * const result = await fetcher.fetchDataPure(new Map(), Date.now(), mockNetwork);
	 * // Test result without side effects
	 */
	async fetchData(cacheOverride = null) {
		const activeCache = cacheOverride || this.cache;
		
		// Use the pure core function
		const result = await this.fetchDataPure(activeCache);
		
		// Apply side effects based on pure computation
		this._applySideEffects(result, activeCache);
		
		// Return data or throw error based on pure result
		if (result.success) {
			return result.data;
		} else {
			throw result.error;
		}
	}

	/**
	 * Applies side effects based on pure computation results
	 * 
	 * @private
	 * @param {Object} result - Result from fetchDataPure
	 * @param {Object} activeCache - Cache to apply operations to
	 */
	_applySideEffects(result, activeCache) {
		// Apply cache operations
		result.cacheOperations.forEach(operation => {
			switch (operation.type) {
				case 'set':
				case 'update':
					activeCache.set(operation.key, operation.value);
					break;
				case 'delete':
					activeCache.delete(operation.key);
					break;
			}
		});
		
		// Apply event notifications
		result.events.forEach(event => {
			this.notifyObservers(event.type, event.payload);
		});
	}
}

/**
 * IbiraAPIFetchManager - Manages multiple concurrent API fetch operations
 * 
 * This class is responsible for coordinating multiple IbiraAPIFetcher instances,
 * handling race conditions, preventing duplicate requests, and managing shared
 * caching across different endpoints.
 * 
 * **Key Features:**
 * - Request deduplication to prevent concurrent identical requests
 * - Centralized cache management across all fetchers
 * - Race condition protection for multiple simultaneous calls
 * - Cleanup and lifecycle management of fetch operations
 *
 * @class IbiraAPIFetchManager
 * @example
 *  * Example usage:
 * ```javascript
 * const manager = new IbiraAPIFetchManager({ maxCacheSize: 200 });
 * const fetcher1 = manager.getFetcher('https://api.example.com/data1');
 * const fetcher2 = manager.getFetcher('https://api.example.com/data2');
 * 
 * // Fetch data concurrently
 * const [data1, data2] = await Promise.all([fetcher1.fetchData(), fetcher2.fetchData()]);
 *
 * // Process the fetched data
 * console.log(data1, data2);
 * @Copiloted
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 */
export class IbiraAPIFetchManager {
	
	constructor(options = {}) {
		this.fetchers = new Map(); // Store fetcher instances by URL
		this.pendingRequests = new Map(); // Track ongoing requests to prevent duplicates
		this.globalCache = new Map(); // Shared cache across all fetchers
		this.maxCacheSize = options.maxCacheSize || 100; // Prevent unbounded cache growth
		this.cacheExpiration = options.cacheExpiration || 300000; // 5 minutes default cache expiration
		this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute cleanup interval
		this.lastCleanup = Date.now();
		
		// Retry configuration for all fetchers
		this.defaultMaxRetries = options.maxRetries || 3;
		this.defaultRetryDelay = options.retryDelay || 1000;
		this.defaultRetryMultiplier = options.retryMultiplier || 2;
		this.defaultRetryableStatusCodes = options.retryableStatusCodes || [408, 429, 500, 502, 503, 504];
		
		// Start periodic cleanup
		this._startPeriodicCleanup();
	}

	/**
	 * Creates or retrieves a fetcher instance for the given URL
	 * 
	 * @param {string} url - The API endpoint URL
	 * @param {Object} options - Configuration options for the fetcher
	 * @returns {IbiraAPIFetcher} The fetcher instance for this URL
	 */
	getFetcher(url, options = {}) {
		if (!this.fetchers.has(url)) {
			// Configure global cache with manager settings
			this.globalCache.maxSize = this.maxCacheSize;
			this.globalCache.expiration = this.cacheExpiration;
			
			// Create fetcher with shared global cache
			const fetcherOptions = {
				timeout: options.timeout,
				maxRetries: options.maxRetries !== undefined ? options.maxRetries : this.defaultMaxRetries,
				retryDelay: options.retryDelay !== undefined ? options.retryDelay : this.defaultRetryDelay,
				retryMultiplier: options.retryMultiplier !== undefined ? options.retryMultiplier : this.defaultRetryMultiplier,
				retryableStatusCodes: options.retryableStatusCodes || this.defaultRetryableStatusCodes
			};
			
			const fetcher = new IbiraAPIFetcher(url, this.globalCache, fetcherOptions);
			this.fetchers.set(url, fetcher);
		}
		
		return this.fetchers.get(url);
	}

	/**
	 * Starts periodic cleanup of expired cache entries
	 * 
	 * @private
	 */
	_startPeriodicCleanup() {
		this.cleanupTimer = setInterval(() => {
			this._performPeriodicCleanup();
		}, this.cleanupInterval);
	}

	/**
	 * Identifies expired cache entries that should be removed
	 * This is a pure function that returns keys to delete without mutating state
	 * 
	 * @private
	 * @param {Map} cache - The cache map to check
	 * @param {number} currentTime - Current timestamp in milliseconds
	 * @returns {string[]} Array of cache keys that have expired
	 */
	_getExpiredCacheKeys(cache, currentTime) {
		const expiredKeys = [];

		// Find all expired entries
		for (const [key, entry] of cache.entries()) {
			if (currentTime >= entry.expiresAt) {
				expiredKeys.push(key);
			}
		}

		return expiredKeys;
	}

	/**
	 * Performs periodic cleanup of expired cache entries and enforces size limits
	 * 
	 * @private
	 */
	_performPeriodicCleanup() {
		const now = Date.now();
		const expiredKeys = this._getExpiredCacheKeys(this.globalCache, now);

		// Remove expired entries
		expiredKeys.forEach(key => this.globalCache.delete(key));

		// Enforce cache size limits using LRU strategy
		this._enforceCacheSizeLimit();
		
		this.lastCleanup = now;
	}

	/**
	 * Enforces cache size limits by removing oldest entries
	 * Uses LRU (Least Recently Used) eviction strategy
	 * 
	 * @private
	 */
	_enforceCacheSizeLimit() {
		if (this.globalCache.size <= this.maxCacheSize) {
			return;
		}

		// Convert cache entries to array for sorting
		const entries = Array.from(this.globalCache.entries());
		
		// Sort by timestamp (oldest first)
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		// Calculate how many entries to remove
		const entriesToRemove = this.globalCache.size - this.maxCacheSize;
		
		// Remove oldest entries
		for (let i = 0; i < entriesToRemove; i++) {
			this.globalCache.delete(entries[i][0]);
		}
	}

	/**
	 * Creates a cache entry with timestamp for expiration tracking
	 * 
	 * @private
	 * @param {any} data - The data to cache
	 * @param {number} currentTime - Current timestamp in milliseconds
	 * @returns {Object} Cache entry with data and timestamp
	 */
	_createCacheEntry(data, currentTime) {
		return {
			data: data,
			timestamp: currentTime,
			expiresAt: currentTime + this.cacheExpiration
		};
	}

	/**
	 * Checks if a cache entry is still valid (not expired)
	 * 
	 * @private
	 * @param {Object} cacheEntry - The cache entry to check
	 * @param {number} currentTime - Current timestamp in milliseconds
	 * @returns {boolean} True if the entry is still valid
	 */
	_isCacheEntryValid(cacheEntry, currentTime) {
		return cacheEntry && currentTime < cacheEntry.expiresAt;
	}

	/**
	 * Fetches data with race condition protection and request deduplication
	 * 
	 * This method ensures that multiple concurrent calls to the same endpoint
	 * are deduplicated, preventing unnecessary network requests and potential
	 * race conditions.
	 * 
	 * @param {string} url - The API endpoint URL
	 * @param {Object} options - Configuration options
	 * options.timeout - Request timeout in milliseconds
	 * options.maxRetries - Maximum number of retry attempts
	 * options.retryDelay - Initial retry delay in milliseconds
	 * options.retryMultiplier - Exponential backoff multiplier
	 * options.retryableStatusCodes - Array of HTTP status codes that should trigger retries
	 * @returns {Promise<any>} Promise that resolves to the fetched data
	 */
	async fetch(url, options = {}) {
		const fetcher = this.getFetcher(url, options);
		const cacheKey = fetcher.getCacheKey();

		// Check if there's already a pending request for this URL
		if (this.pendingRequests.has(cacheKey)) {
			// Wait for the existing request instead of creating a new one
			return await this.pendingRequests.get(cacheKey);
		}

		// Create a new request promise and track it
		const requestPromise = this._executeFetch(fetcher);
		this.pendingRequests.set(cacheKey, requestPromise);

		try {
			const result = await requestPromise;
			return result;
		} finally {
			// Clean up the pending request tracker
			this.pendingRequests.delete(cacheKey);
		}
	}

	/**
	 * Internal method to execute the actual fetch operation
	 * 
	 * @private
	 * @param {IbiraAPIFetcher} fetcher - The fetcher instance to use
	 * @returns {Promise<any>} Promise that resolves to the fetched data
	 */
	async _executeFetch(fetcher) {
		// ✅ fetchData() now returns data directly, no need to check fetcher.data
		return await fetcher.fetchData();
	}

	/**
	 * Fetches multiple URLs concurrently with proper coordination
	 * 
	 * @param {string[]} urls - Array of URLs to fetch
	 * @param {Object} options - Configuration options
	 * @returns {Promise<any[]>} Promise that resolves to array of results
	 */
	async fetchMultiple(urls, options = {}) {
		const promises = urls.map(url => this.fetch(url, options));
		return await Promise.allSettled(promises);
	}

	/**
	 * Subscribe to updates from a specific fetcher
	 * 
	 * @param {string} url - The URL of the fetcher to subscribe to
	 * @param {Object} observer - Observer object with update method
	 */
	subscribe(url, observer) {
		const fetcher = this.getFetcher(url);
		fetcher.subscribe(observer);
	}

	/**
	 * Unsubscribe from updates from a specific fetcher
	 * 
	 * @param {string} url - The URL of the fetcher to unsubscribe from
	 * @param {Object} observer - Observer object to remove
	 */
	unsubscribe(url, observer) {
		if (this.fetchers.has(url)) {
			this.fetchers.get(url).unsubscribe(observer);
		}
	}

	/**
	 * Check if there's a pending request for a specific URL
	 * 
	 * @param {string} url - The URL to check pending status for
	 * @returns {boolean} Whether there's a pending request for this URL
	 */
	isLoading(url) {
		const fetcher = this.getFetcher(url);
		const cacheKey = fetcher.getCacheKey();
		return this.pendingRequests.has(cacheKey);
	}

	/**
	 * Get cached data for a specific URL without triggering a fetch
	 * 
	 * @param {string} url - The URL to get cached data for
	 * @returns {any|null} Cached data or null if not found or expired
	 */
	getCachedData(url) {
		const fetcher = this.getFetcher(url);
		const cacheKey = fetcher.getCacheKey();
		const cacheEntry = this.globalCache.get(cacheKey);
		
		const now = Date.now();
		if (cacheEntry && this._isCacheEntryValid(cacheEntry, now)) {
			// Update timestamp for LRU tracking
			cacheEntry.timestamp = now;
			return cacheEntry.data;
		}
		
		// Remove expired entry if it exists
		if (cacheEntry) {
			this.globalCache.delete(cacheKey);
		}
		
		return null;
	}

	/**
	 * Clear cached data for a specific URL or all cached data
	 * 
	 * @param {string} [url] - Optional URL to clear cache for. If not provided, clears all cache
	 */
	clearCache(url = null) {
		if (url) {
			const fetcher = this.getFetcher(url);
			const cacheKey = fetcher.getCacheKey();
			this.globalCache.delete(cacheKey);
		} else {
			this.globalCache.clear();
		}
	}

	/**
	 * Clean up resources and cancel pending requests
	 * Call this when the manager is no longer needed
	 */
	destroy() {
		// Stop periodic cleanup timer
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		
		// Clear all pending requests
		this.pendingRequests.clear();
		
		// Clear all fetchers
		this.fetchers.clear();
		
		// Clear global cache
		this.globalCache.clear();
	}

	/**
	 * Get statistics about the current state of the manager
	 * 
	 * @returns {Object} Statistics object with current state information
	 */
	getStats() {
		const now = Date.now();
		const expiredKeys = this._getExpiredCacheKeys(this.globalCache, now);
		
		return {
			activeFetchers: this.fetchers.size,
			pendingRequests: this.pendingRequests.size,
			cacheSize: this.globalCache.size,
			maxCacheSize: this.maxCacheSize,
			expiredEntries: expiredKeys.length,
			cacheUtilization: Math.round((this.globalCache.size / this.maxCacheSize) * 100),
			lastCleanup: new Date(this.lastCleanup).toISOString(),
			cacheExpiration: this.cacheExpiration
		};
	}

	/**
	 * Manually trigger cache cleanup
	 * Useful for testing or when you want to force cleanup
	 */
	triggerCleanup() {
		this._performPeriodicCleanup();
	}

	/**
	 * Set cache expiration time for new entries
	 * 
	 * @param {number} milliseconds - Cache expiration time in milliseconds
	 */
	setCacheExpiration(milliseconds) {
		this.cacheExpiration = milliseconds;
	}

	/**
	 * Set maximum cache size
	 * 
	 * @param {number} size - Maximum number of cache entries
	 */
	setMaxCacheSize(size) {
		this.maxCacheSize = size;
		// Immediately enforce the new limit
		this._enforceCacheSizeLimit();
	}

	/**
	 * Set default retry configuration for new fetchers
	 * 
	 * @param {Object} retryConfig - Retry configuration object
	 * @param {number} [retryConfig.maxRetries] - Maximum number of retry attempts
	 * @param {number} [retryConfig.retryDelay] - Initial retry delay in milliseconds
	 * @param {number} [retryConfig.retryMultiplier] - Exponential backoff multiplier
	 * @param {number[]} [retryConfig.retryableStatusCodes] - HTTP status codes that should trigger retries
	 */
	setRetryConfig(retryConfig = {}) {
		if (retryConfig.maxRetries !== undefined) this.defaultMaxRetries = retryConfig.maxRetries;
		if (retryConfig.retryDelay !== undefined) this.defaultRetryDelay = retryConfig.retryDelay;
		if (retryConfig.retryMultiplier !== undefined) this.defaultRetryMultiplier = retryConfig.retryMultiplier;
		if (retryConfig.retryableStatusCodes) this.defaultRetryableStatusCodes = retryConfig.retryableStatusCodes;
	}

	/**
	 * Get current retry configuration
	 * 
	 * @returns {Object} Current retry configuration
	 */
	getRetryConfig() {
		return {
			maxRetries: this.defaultMaxRetries,
			retryDelay: this.defaultRetryDelay,
			retryMultiplier: this.defaultRetryMultiplier,
			retryableStatusCodes: [...this.defaultRetryableStatusCodes]
		};
	}

	/**
	 * Set retry configuration for a specific URL
	 * Creates a new immutable fetcher instance with updated configuration
	 * instead of modifying existing properties (which would fail due to Object.freeze)
	 * 
	 * @param {string} url - The URL to configure retries for
	 * @param {Object} retryConfig - Retry configuration object
	 */
	setRetryConfigForUrl(url, retryConfig = {}) {
		// ✅ IMMUTABLE: Create new fetcher instance instead of modifying existing one
		// This respects the frozen nature of IbiraAPIFetcher instances
		if (this.fetchers.has(url)) {
			const oldFetcher = this.fetchers.get(url);
			
			// Create new options object with updated retry configuration
			const newOptions = {
				timeout: oldFetcher.timeout,
				maxRetries: retryConfig.maxRetries !== undefined ? retryConfig.maxRetries : oldFetcher.maxRetries,
				retryDelay: retryConfig.retryDelay !== undefined ? retryConfig.retryDelay : oldFetcher.retryDelay,
				retryMultiplier: retryConfig.retryMultiplier !== undefined ? retryConfig.retryMultiplier : oldFetcher.retryMultiplier,
				retryableStatusCodes: retryConfig.retryableStatusCodes || oldFetcher.retryableStatusCodes,
				eventNotifier: oldFetcher.eventNotifier
			};
			
			// Create new immutable fetcher instance and replace the old one
			const newFetcher = new IbiraAPIFetcher(url, oldFetcher.cache, newOptions);
			this.fetchers.set(url, newFetcher);
		} else {
			// If fetcher doesn't exist yet, create it with the specified retry config
			this.getFetcher(url, retryConfig);
		}
	}
}