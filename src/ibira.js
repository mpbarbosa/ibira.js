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
		return new IbiraAPIFetcher(url, { ...options, cache });
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
			entries: () => []
		};
		return new IbiraAPIFetcher(url, { ...options, cache: noCache });
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
		return new IbiraAPIFetcher(url, { ...options, eventNotifier: callbackNotifier });
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
		return new IbiraAPIFetcher(url, { ...options, eventNotifier: noEvents });
	}

    constructor(url, options = {}) {
		this.url = url;
		// this.observers = []; // ❌ REMOVED: Mutable observer state for referential transparency
		// this.fetching = false; // ❌ REMOVED: Mutable fetching state for referential transparency
		// this.data = null; // ❌ REMOVED: Mutable data state for referential transparency
		// this.error = null; // ❌ REMOVED: Mutable error state for referential transparency
		// this.loading = false; // ❌ REMOVED: Mutable loading state for referential transparency
		this.lastFetch = 0;
		this.timeout = options.timeout || 10000;
		
		// ✅ IMPROVED: Cache as dependency injection for better referential transparency
		this.cache = options.cache || new DefaultCache({
			maxSize: options.maxCacheSize || 50,
			expiration: options.cacheExpiration || 300000
		});

		// ✅ IMPROVED: Event notifier as dependency injection for better referential transparency
		this.eventNotifier = options.eventNotifier || new DefaultEventNotifier();
		
		this.cacheExpiration = options.cacheExpiration || 300000; // 5 minutes default cache expiration (ms)
		this.maxCacheSize = options.maxCacheSize || 50; // Maximum number of cached items
		this.maxRetries = options.maxRetries || 3; // Maximum number of retry attempts
		this.retryDelay = options.retryDelay || 1000; // Initial retry delay in milliseconds
		this.retryMultiplier = options.retryMultiplier || 2; // Exponential backoff multiplier
		this.retryableStatusCodes = options.retryableStatusCodes || [408, 429, 500, 502, 503, 504]; // HTTP status codes that should trigger retries
	}	getCacheKey() {
		// Override this method in subclasses to provide a unique cache key
		return this.url;
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
	 * Enforces cache size limits by removing oldest entries
	 * Uses LRU (Least Recently Used) eviction strategy
	 * 
	 * @private
	 * @param {Object} [cache] - Optional cache instance, defaults to this.cache
	 */
	_enforceCacheSizeLimit(cache = null) {
		const activeCache = cache || this.cache;
		
		if (activeCache.size <= this.maxCacheSize) {
			return;
		}

		// Convert cache entries to array for sorting
		const entries = Array.from(activeCache.entries());
		
		// Sort by timestamp (oldest first)
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
		
		// Calculate how many entries to remove
		const entriesToRemove = activeCache.size - this.maxCacheSize;
		
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
 * Fetches data from the configured URL with robust caching, loading states, and error handling.
 * 
 * This method implements a comprehensive data fetching strategy designed to efficiently retrieve 
 * and manage data from external APIs while providing a smooth user experience through intelligent 
 * caching and proper state management.
 * 
 * **Referential Transparency Improvement:**
 * This method now returns the fetched data directly instead of storing it in instance state,
 * making it more referentially transparent by reducing mutable state and side effects. Loading 
 * state management has been removed from instance state and delegated to external observers
 * or the calling code, further improving referential transparency.
 * 
 * **Enhanced Cache Strategy:**
 * Cache is now externalized as a dependency injection, making the class more testable and 
 * allowing different caching strategies. The cache can be passed during construction or 
 * defaults to a built-in implementation. This improves referential transparency by making
 * cache dependencies explicit rather than hidden internal state.
 * 
 * **Enhanced Event Notification:**
 * Event notifications are now externalized through dependency injection, removing mutable
 * observer state from the class instance. Events can be handled through external event
 * notifiers, callback functions, or disabled entirely for maximum referential transparency.
 * This eliminates the side effects of observer management and makes event handling explicit.
 * 
 * **Caching Strategy:**
 * The method starts by generating a cache key using getCacheKey(), which by default returns the URL 
 * but can be overridden in subclasses for more sophisticated caching strategies. It immediately 
 * checks if the data already exists in the cache - if it does, it retrieves the cached data and 
 * returns it directly, avoiding unnecessary network requests. This caching mechanism significantly 
 * improves performance by reducing redundant API calls.
 * 
 * **Loading State Management:**
 * Loading state management is now handled functionally through external event notifications. The 
 * calling code can track loading state based on method execution and event callbacks,
 * eliminating the need for mutable loading state within the class instance.
 * 
 * **Network Operations:**
 * The actual data fetching uses the modern Fetch API with proper error handling - it checks if 
 * the response is successful using `response.ok` and throws a meaningful error if the request fails. 
 * The method follows the JSON API pattern by calling `response.json()` to parse the response data.
 * 
 * **Data Return:**
 * Upon successful retrieval, the method returns the data directly and caches it for future use,
 * ensuring consistent data availability without storing it in instance state.
 * 
 * **Error Handling:**
 * The error handling is comprehensive, catching any network errors, parsing errors, or HTTP errors 
 * and throwing them directly for the calling code to handle. This provides a clean functional 
 * approach where errors flow through exceptions rather than mutable state, improving referential transparency.
 * 
 * **Functional Approach:**
 * Without mutable loading state, the method is more functionally pure. Loading state can be 
 * managed externally by observing the method's execution lifecycle or through observer events,
 * providing a cleaner separation of concerns and improved testability.
 * 
 * @async
 * @param {Object} [cacheOverride] - Optional cache instance to use instead of the default
 * @returns {Promise<any>} Resolves with the fetched data, or retrieved from cache
 * @throws {Error} Network errors, HTTP errors, or JSON parsing errors are thrown directly
 * 
 * @example
 * // Basic usage with automatic caching - now returns data directly
 * const fetcher = new IbiraAPIFetcher('https://api.example.com/data');
 * const data = await fetcher.fetchData();
 * console.log(data); // Retrieved data
 * // Loading state can be managed externally during await
 * 
 * @example
 * // Custom cache injection for better referential transparency
 * const customCache = new Map();
 * const fetcher = new IbiraAPIFetcher('https://api.example.com/data', { cache: customCache });
 * const data = await fetcher.fetchData();
 * 
 * @example
 * // Purely functional event handling with callback
 * const fetcher = IbiraAPIFetcher.withEventCallback(
 *   'https://api.example.com/data',
 *   (event, data) => {
 *     if (event === 'loading-start') setLoading(true);
 *     if (event === 'success') { setData(data); setLoading(false); }
 *     if (event === 'error') { setError(data.error); setLoading(false); }
 *   }
 * );
 * 
 * @example
 * // Maximum referential transparency - no events, no cache
 * const fetcher = IbiraAPIFetcher.withoutEvents('https://api.example.com/data');
 * const pureFetcher = IbiraAPIFetcher.withoutCache('https://api.example.com/data');
 * 
 * @example
 * // Error handling with external loading state management
 * let isLoading = false;
 * try {
 *   isLoading = true;
 *   const data = await fetcher.fetchData();
 *   console.log('Success:', data);
 * } catch (error) {
 *   console.error('Fetch failed:', error.message);
 * } finally {
 *   isLoading = false;
 * }
 * 
 * @example
 * // Traditional observer pattern (backward compatible)
 * fetcher.subscribe({
 *   update(event, data) {
 *     if (event === 'loading-start') setLoading(true);
 *     if (event === 'success' || event === 'error') setLoading(false);
 *   }
 * });
 * 
 * @see {@link getCacheKey} - Override this method for custom cache key generation
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 */
	async fetchData(cacheOverride = null) {
		// ✅ IMPROVED: Use provided cache or fall back to instance cache for better referential transparency
		const activeCache = cacheOverride || this.cache;
		
		// Generate cache key for this request (can be overridden in subclasses)
		const cacheKey = this.getCacheKey();

		// Clean up expired cache entries before checking cache
		this._cleanupExpiredCache(activeCache);

		// Get current time once for consistency
		let now = Date.now();

		// Check cache first - if valid data exists, return immediately to avoid network request
		if (activeCache.has(cacheKey)) {
			const cacheEntry = activeCache.get(cacheKey);
			if (this._isCacheEntryValid(cacheEntry, now)) {
				// Update timestamp for LRU tracking
				cacheEntry.timestamp = now;
				return cacheEntry.data; // ✅ Return cached data directly (more referentially transparent)
			} else {
				// Remove expired entry
				activeCache.delete(cacheKey);
			}
		}

		// Notify observers that loading has started (replaces mutable loading state)
		this.notifyObservers('loading-start', { url: this.url, cacheKey });

		let lastError = null;
		let attempt = 0;

		// Retry loop with exponential backoff
		while (attempt <= this.maxRetries) {
				try {
					// Create a new AbortController for each attempt
					const abortController = new AbortController();
					
					// Perform the network request
					const data = await this._performSingleRequest(abortController);

					// Get current time for cache entry
					now = Date.now();

					// Create cache entry with expiration timestamp
					const cacheEntry = this._createCacheEntry(data, now);
					
					// ✅ IMPROVED: Cache the result using active cache for better referential transparency
					activeCache.set(cacheKey, cacheEntry);
					
					// Enforce cache size limits after adding new entry
					this._enforceCacheSizeLimit(activeCache);

					// Notify observers of successful fetch
					this.notifyObservers('success', data);

					// ✅ Return data directly instead of storing in instance state
					return data;

				} catch (error) {
					lastError = error;
					attempt++;

					// Check if this error is retryable and we have attempts left
					if (attempt <= this.maxRetries && this._isRetryableError(error)) {
						// Calculate delay for next attempt
						const delay = this._calculateRetryDelay(attempt - 1);
						
						// Notify observers of retry attempt
						this.notifyObservers('retry', {
							attempt: attempt,
							maxRetries: this.maxRetries,
							error: error,
							retryIn: delay
						});

						// Wait before retrying
						await this._sleep(delay);
						continue;
					}

					// Error is not retryable or we've exhausted all retries
					break;
				}
			}

		// All retry attempts failed - notify observers and throw error
		this.notifyObservers('error', {
			error: lastError,
			attempts: attempt,
			maxRetries: this.maxRetries
		});

		// ✅ Throw error directly instead of storing it (more referentially transparent)
		throw lastError;
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
			const fetcher = new IbiraAPIFetcher(url);
			
			// Apply any custom options
			if (options.timeout) fetcher.timeout = options.timeout;
			if (options.cacheExpiration) fetcher.cacheExpiration = options.cacheExpiration;
			if (options.maxCacheSize) fetcher.maxCacheSize = options.maxCacheSize;
			
			// Apply retry configuration (use provided options or manager defaults)
			fetcher.maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.defaultMaxRetries;
			fetcher.retryDelay = options.retryDelay !== undefined ? options.retryDelay : this.defaultRetryDelay;
			fetcher.retryMultiplier = options.retryMultiplier !== undefined ? options.retryMultiplier : this.defaultRetryMultiplier;
			fetcher.retryableStatusCodes = options.retryableStatusCodes || this.defaultRetryableStatusCodes;
			
			// Share the global cache with individual fetchers
			fetcher.cache = this.globalCache;
			
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
	 * 
	 * @param {string} url - The URL to configure retries for
	 * @param {Object} retryConfig - Retry configuration object
	 */
	setRetryConfigForUrl(url, retryConfig = {}) {
		const fetcher = this.getFetcher(url);
		
		if (retryConfig.maxRetries !== undefined) fetcher.maxRetries = retryConfig.maxRetries;
		if (retryConfig.retryDelay !== undefined) fetcher.retryDelay = retryConfig.retryDelay;
		if (retryConfig.retryMultiplier !== undefined) fetcher.retryMultiplier = retryConfig.retryMultiplier;
		if (retryConfig.retryableStatusCodes) fetcher.retryableStatusCodes = retryConfig.retryableStatusCodes;
	}
}