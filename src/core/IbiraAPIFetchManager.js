// IbiraAPIFetchManager.js
// Manages multiple concurrent API fetch operations
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

import { IbiraAPIFetcher } from './IbiraAPIFetcher.js';

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
