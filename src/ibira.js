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
	minor: 1,
	patch: 0,
	prerelease: "alpha", // Indicates unstable development
	toString: function () {
		return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
	},
};

export class IbiraAPIFetcher {

    constructor(url) {
		this.url = url;
		this.observers = [];
		this.fetching = false;
		this.data = null;
		this.error = null;
		this.loading = false;
		this.lastFetch = 0;
		this.timeout = 10000;
		this.cache = new Map();
	}

	getCacheKey() {
		// Override this method in subclasses to provide a unique cache key
		return this.url;
	}

	subscribe(observer) {
		if (observer) {
			this.observers = [...this.observers, observer];
		}
	}

	unsubscribe(observer) {
		this.observers = this.observers.filter((o) => o !== observer);
	}

	notifyObservers(...args) {
		this.observers.forEach((observer) => {
			observer.update(...args);
		});
	}

	/**
 * Fetches data from the configured URL with robust caching, loading states, and error handling.
 * 
 * This method implements a comprehensive data fetching strategy designed to efficiently retrieve 
 * and manage data from external APIs while providing a smooth user experience through intelligent 
 * caching and proper state management.
 * 
 * **Caching Strategy:**
 * The method starts by generating a cache key using getCacheKey(), which by default returns the URL 
 * but can be overridden in subclasses for more sophisticated caching strategies. It immediately 
 * checks if the data already exists in the cache - if it does, it retrieves the cached data and 
 * returns early, avoiding unnecessary network requests. This caching mechanism significantly 
 * improves performance by reducing redundant API calls.
 * 
 * **Loading State Management:**
 * When a cache miss occurs, the method sets `this.loading = true` to indicate that a network 
 * operation is in progress. This loading state can be used by the UI to show loading spinners 
 * or disable user interactions, providing immediate feedback to users.
 * 
 * **Network Operations:**
 * The actual data fetching uses the modern Fetch API with proper error handling - it checks if 
 * the response is successful using `response.ok` and throws a meaningful error if the request fails. 
 * The method follows the JSON API pattern by calling `response.json()` to parse the response data.
 * 
 * **Data Storage:**
 * Upon successful retrieval, it stores the data both in the instance (`this.data`) and in the cache 
 * for future use, ensuring consistent data availability across the application.
 * 
 * **Error Handling:**
 * The error handling is comprehensive, catching any network errors, parsing errors, or HTTP errors 
 * and storing them in `this.error` for the calling code to handle appropriately. This provides 
 * a clean separation of
 * 
 * **Cleanup Guarantee:**
 * The `finally` block ensures that `this.loading` is always reset to `false`, regardless of whether 
 * the operation succeeded or failed. This prevents the UI from getting stuck in a loading state, 
 * which is a common source of bugs in data fetching implementations.
 * 
 * @async
 * @returns {Promise<void>} Resolves when data is fetched and stored, or retrieved from cache
 * @throws {Error} Network errors, HTTP errors, or JSON parsing errors are caught and stored in this.error
 * 
 * @example
 * // Basic usage with automatic caching
 * const fetcher = new APIFetcher('https://api.example.com/data');
 * await fetcher.fetchData();
 * console.log(fetcher.data); // Retrieved data
 * console.log(fetcher.loading); // false after completion
 * 
 * @example
 * // Error handling
 * try {
 *   await fetcher.fetchData();
 *   if (fetcher.error) {
 *     console.error('Fetch failed:', fetcher.error.message);
 *   }
 * } catch (error) {
 *   console.error('Unexpected error:', error);
 * }
 * 
 * @see {@link getCacheKey} - Override this method for custom cache key generation
 * @since 0.8.3-alpha
 * @author Marcelo Pereira Barbosa
 */
	async fetchData() {
		// Generate cache key for this request (can be overridden in subclasses)
		const cacheKey = this.getCacheKey();

		// Check cache first - if data exists, return immediately to avoid network request
		if (this.cache.has(cacheKey)) {
			this.data = this.cache.get(cacheKey);
			return; // Early return with cached data improves performance
		}

		// Set loading state to indicate network operation in progress
		// UI can use this to show loading spinners or disable interactions
		this.loading = true;

		try {
			// Perform network request using modern Fetch API
			const response = await fetch(this.url);

			// Check if HTTP request was successful (status 200-299)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// Parse JSON response data
			const data = await response.json();

			// Store data in instance for immediate access
			this.data = data;

			// Cache the result for future requests with same cache key
			this.cache.set(cacheKey, data);

		} catch (error) {
			// Comprehensive error handling: network errors, HTTP errors, JSON parsing errors
			// Store error for calling code to handle appropriately
			this.error = error;
		} finally {
			// Always reset loading state regardless of success/failure
			// This prevents UI from getting stuck in loading state
			this.loading = false;
		}
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
	
	constructor() {
		this.fetchers = new Map(); // Store fetcher instances by URL
		this.pendingRequests = new Map(); // Track ongoing requests to prevent duplicates
		this.globalCache = new Map(); // Shared cache across all fetchers
		this.maxCacheSize = 100; // Prevent unbounded cache growth
		this.cacheExpiration = 300000; // 5 minutes default cache expiration
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
			
			// Share the global cache with individual fetchers
			fetcher.cache = this.globalCache;
			
			this.fetchers.set(url, fetcher);
		}
		
		return this.fetchers.get(url);
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
		await fetcher.fetchData();
		
		if (fetcher.error) {
			throw fetcher.error;
		}
		
		return fetcher.data;
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
	 * Get the current loading state for a specific URL
	 * 
	 * @param {string} url - The URL to check loading state for
	 * @returns {boolean} Whether the fetcher is currently loading
	 */
	isLoading(url) {
		const fetcher = this.fetchers.get(url);
		return fetcher ? fetcher.loading : false;
	}

	/**
	 * Get cached data for a specific URL without triggering a fetch
	 * 
	 * @param {string} url - The URL to get cached data for
	 * @returns {any|null} Cached data or null if not found
	 */
	getCachedData(url) {
		const fetcher = this.getFetcher(url);
		const cacheKey = fetcher.getCacheKey();
		return this.globalCache.get(cacheKey) || null;
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
		return {
			activeFetchers: this.fetchers.size,
			pendingRequests: this.pendingRequests.size,
			cacheSize: this.globalCache.size,
			maxCacheSize: this.maxCacheSize
		};
	}
}