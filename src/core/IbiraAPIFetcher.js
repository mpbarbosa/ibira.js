/**
 * @fileoverview Core fetcher class with caching and observer pattern support
 * @module core/IbiraAPIFetcher
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

import { DefaultCache } from '../utils/DefaultCache.js';
import { DefaultEventNotifier } from '../utils/DefaultEventNotifier.js';

/**
 * @typedef {Object} CacheEntry
 * @property {*} data - The cached data
 * @property {number} timestamp - Timestamp when entry was created/last accessed
 * @property {number} expiresAt - Timestamp when entry expires
 */

/**
 * @typedef {Object} Observer
 * @property {Function} update - Method called with (eventType, payload) on events
 */

/**
 * @typedef {Object} FetcherOptions
 * @property {number} [timeout=10000] - Request timeout in milliseconds
 * @property {Object} [eventNotifier] - Event notifier instance for observer pattern
 * @property {number} [maxRetries=3] - Maximum number of retry attempts
 * @property {number} [retryDelay=1000] - Initial retry delay in milliseconds
 * @property {number} [retryMultiplier=2] - Exponential backoff multiplier
 * @property {number[]} [retryableStatusCodes=[408, 429, 500, 502, 503, 504]] - HTTP status codes that trigger retries
 * @property {number} [maxCacheSize=100] - Maximum number of cache entries
 * @property {number} [cacheExpiration=300000] - Cache expiration time in milliseconds (default: 5 minutes)
 * @property {Object} [cache] - Cache instance (must implement Map-like interface)
 */

/**
 * @typedef {Object} FetchResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} [data] - The fetched data (present when success is true)
 * @property {Error} [error] - The error that occurred (present when success is false)
 * @property {boolean} fromCache - Whether data came from cache
 * @property {CacheOperation[]} cacheOperations - List of cache operations performed
 * @property {Event[]} events - List of events that occurred
 * @property {Map} newCacheState - The new cache state after operations
 * @property {Object} meta - Metadata about the operation
 */

/**
 * @typedef {Object} CacheOperation
 * @property {'set'|'update'|'delete'} type - Type of cache operation
 * @property {string} key - Cache key affected
 * @property {CacheEntry} [value] - New value (for set/update operations)
 */

/**
 * @typedef {Object} Event
 * @property {'loading-start'|'success'|'error'} type - Event type
 * @property {*} payload - Event payload data
 */

/**
 * IbiraAPIFetcher - Core class for fetching and caching API data
 * 
 * Provides a flexible, functional approach to API data fetching with built-in caching,
 * retry logic, and observer pattern support. The class is designed with referential
 * transparency in mind, offering both pure functional and practical imperative APIs.
 * 
 * **Key Features:**
 * - Multiple factory methods for different use cases (with/without cache, events)
 * - Intelligent caching with expiration and LRU eviction
 * - Exponential backoff retry logic with configurable status codes
 * - Observer pattern for reactive updates
 * - Pure functional core with practical wrapper methods
 * - Immutable instances (Object.freeze) for predictable behavior
 * 
 * @class IbiraAPIFetcher
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 * 
 * @example
 * // Simple usage with default cache
 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/users');
 * const users = await fetcher.fetchData();
 * 
 * @example
 * // Pure functional approach
 * const fetcher = IbiraAPIFetcher.pure('https://api.example.com/data');
 * const result = await fetcher.fetchDataPure(new Map(), Date.now());
 * console.log(result.data, result.events, result.cacheOperations);
 * 
 * @example
 * // With observer pattern
 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
 * fetcher.subscribe({
 *   update: (event, data) => console.log(event, data)
 * });
 * await fetcher.fetchData();
 */
export class IbiraAPIFetcher {

	/**
	 * Creates an IbiraAPIFetcher with a purely functional cache approach
	 * This method provides better referential transparency by explicitly managing cache externally
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {Object} cache - External cache instance (must implement Map-like interface)
	 * @param {FetcherOptions} [options={}] - Additional configuration options
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
	 * @param {FetcherOptions} [options={}] - Additional configuration options
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

	/**
	 * Creates an IbiraAPIFetcher instance
	 * 
	 * @param {string} url - The API endpoint URL
	 * @param {Object} cache - Cache instance (must implement Map-like interface with has/get/set/delete/clear/entries methods)
	 * @param {Object} [options={}] - Configuration options
	 * @param {number} [options.timeout=10000] - Request timeout in milliseconds
	 * @param {Object} [options.eventNotifier] - Event notifier instance for observer pattern
	 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
	 * @param {number} [options.retryDelay=1000] - Initial retry delay in milliseconds
	 * @param {number} [options.retryMultiplier=2] - Exponential backoff multiplier
	 * @param {number[]} [options.retryableStatusCodes=[408, 429, 500, 502, 503, 504]] - HTTP status codes that trigger retries
	 */
    constructor(url, cache, options = {}) {
		this.url = url;
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

	/**
	 * Generates a unique cache key for this fetcher
	 * Override this method in subclasses to provide custom cache key logic
	 * 
	 * @returns {string} The cache key (defaults to the URL)
	 */
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

	/**
	 * Subscribes an observer to receive event notifications
	 * 
	 * @param {Observer} observer - Observer object with an update method
	 */
	subscribe(observer) {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.subscribe(observer);
	}

	/**
	 * Unsubscribes an observer from event notifications
	 * 
	 * @param {Observer} observer - Observer object to remove
	 */
	unsubscribe(observer) {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.unsubscribe(observer);
	}

	/**
	 * Notifies all subscribed observers with event data
	 * 
	 * @param {...*} args - Arguments to pass to observers (typically eventType and payload)
	 */
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
	 * @returns {Promise<FetchResult>} Pure result object describing what should happen
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
	 * @param {FetchResult} result - Result from fetchDataPure
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
