/**
 * @fileoverview Manager for coordinating multiple concurrent API fetch operations
 * @module core/IbiraAPIFetchManager
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

import { IbiraAPIFetcher } from './IbiraAPIFetcher.js';

/**
 * @typedef {Object} ManagerOptions
 * @property {number} [maxCacheSize=100] - Maximum number of cache entries
 * @property {number} [cacheExpiration=300000] - Cache expiration time in milliseconds (default: 5 minutes)
 * @property {number} [cleanupInterval=60000] - Interval for periodic cache cleanup in milliseconds (default: 1 minute)
 * @property {number} [maxRetries=3] - Default maximum retry attempts for fetchers
 * @property {number} [retryDelay=1000] - Default initial retry delay in milliseconds
 * @property {number} [retryMultiplier=2] - Default exponential backoff multiplier for retries
 * @property {number[]} [retryableStatusCodes=[408, 429, 500, 502, 503, 504]] - Default HTTP status codes that trigger retries
 */

/**
 * @typedef {Object} ManagerStats
 * @property {number} activeFetchers - Number of active fetcher instances
 * @property {number} pendingRequests - Number of pending requests
 * @property {number} cacheSize - Current number of cached entries
 * @property {number} maxCacheSize - Maximum cache size limit
 * @property {number} expiredEntries - Number of expired entries not yet cleaned
 * @property {number} cacheUtilization - Cache utilization percentage
 * @property {string} lastCleanup - ISO timestamp of last cleanup
 * @property {number} cacheExpiration - Cache expiration time in milliseconds
 */

/**
 * @typedef {Object} RetryConfig
 * @property {number} [maxRetries] - Maximum number of retry attempts
 * @property {number} [retryDelay] - Initial retry delay in milliseconds
 * @property {number} [retryMultiplier] - Exponential backoff multiplier
 * @property {number[]} [retryableStatusCodes] - HTTP status codes that should trigger retries
 */

/**
 * IbiraAPIFetchManager - Manages multiple concurrent API fetch operations
 * 
 * This class coordinates multiple IbiraAPIFetcher instances, handling race conditions,
 * preventing duplicate requests, and managing shared caching across different endpoints.
 * It provides a centralized way to manage API interactions in your application.
 * 
 * **Key Features:**
 * - Request deduplication to prevent concurrent identical requests
 * - Centralized cache management across all fetchers  
 * - Race condition protection for multiple simultaneous calls
 * - Automatic periodic cache cleanup
 * - Per-URL and global retry configuration
 * - Statistics and monitoring capabilities
 * - Lifecycle management for cleanup
 * 
 * @class IbiraAPIFetchManager
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 * 
 * @example
 * // Create manager with custom settings
 * const manager = new IbiraAPIFetchManager({
 *   maxCacheSize: 200,
 *   cacheExpiration: 10 * 60 * 1000 // 10 minutes
 * });
 * 
 * // Fetch single URL
 * const data = await manager.fetch('https://api.example.com/data');
 * 
 * @example
 * // Fetch multiple URLs concurrently
 * const urls = [
 *   'https://api.example.com/users',
 *   'https://api.example.com/posts'
 * ];
 * const results = await manager.fetchMultiple(urls);
 * 
 * @example
 * // Subscribe to events
 * manager.subscribe('https://api.example.com/data', {
 *   update: (event, payload) => console.log(event, payload)
 * });
 * 
 * @example
 * // Clean up when done
 * manager.destroy();
 */
export class IbiraAPIFetchManager {
	
	/**
	 * Creates a new IbiraAPIFetchManager instance
	 * 
	 * @param {ManagerOptions} [options={}] - Configuration options
	 * 
	 * @example
	 * // Create manager with custom settings
	 * const manager = new IbiraAPIFetchManager({
	 *   maxCacheSize: 200,
	 *   cacheExpiration: 10 * 60 * 1000, // 10 minutes
	 *   maxRetries: 5
	 * });
	 */
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
	 * @param {Object} [options={}] - Configuration options for the fetcher
	 * @param {number} [options.timeout] - Request timeout in milliseconds
	 * @param {number} [options.maxRetries] - Maximum number of retry attempts
	 * @param {number} [options.retryDelay] - Initial retry delay in milliseconds
	 * @param {number} [options.retryMultiplier] - Exponential backoff multiplier
	 * @param {number[]} [options.retryableStatusCodes] - HTTP status codes that should trigger retries
	 * @returns {IbiraAPIFetcher} The fetcher instance for this URL
	 * 
	 * @example
	 * const fetcher = manager.getFetcher('https://api.example.com/data', {
	 *   timeout: 5000,
	 *   maxRetries: 5
	 * });
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
	 * @async
	 * @param {string} url - The API endpoint URL
	 * @param {Object} [options={}] - Configuration options
	 * @param {number} [options.timeout] - Request timeout in milliseconds
	 * @param {number} [options.maxRetries] - Maximum number of retry attempts
	 * @param {number} [options.retryDelay] - Initial retry delay in milliseconds
	 * @param {number} [options.retryMultiplier] - Exponential backoff multiplier
	 * @param {number[]} [options.retryableStatusCodes] - Array of HTTP status codes that should trigger retries
	 * @returns {Promise<*>} Promise that resolves to the fetched data
	 * @throws {Error} Network errors, HTTP errors, or JSON parsing errors
	 * 
	 * @example
	 * try {
	 *   const data = await manager.fetch('https://api.example.com/users');
	 *   console.log(data);
	 * } catch (error) {
	 *   console.error('Fetch failed:', error);
	 * }
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
	 * @async
	 * @param {IbiraAPIFetcher} fetcher - The fetcher instance to use
	 * @returns {Promise<*>} Promise that resolves to the fetched data
	 */
	async _executeFetch(fetcher) {
		// ✅ fetchData() now returns data directly, no need to check fetcher.data
		return await fetcher.fetchData();
	}

	/**
	 * Fetches multiple URLs concurrently with proper coordination
	 * 
	 * @async
	 * @param {string[]} urls - Array of URLs to fetch
	 * @param {Object} [options={}] - Configuration options applied to all fetchers
	 * @returns {Promise<PromiseSettledResult[]>} Promise that resolves to array of results with status and value/reason
	 * 
	 * @example
	 * const urls = [
	 *   'https://api.example.com/users',
	 *   'https://api.example.com/posts'
	 * ];
	 * const results = await manager.fetchMultiple(urls);
	 * results.forEach(result => {
	 *   if (result.status === 'fulfilled') {
	 *     console.log('Success:', result.value);
	 *   } else {
	 *     console.error('Error:', result.reason);
	 *   }
	 * });
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
	 * @param {Function} observer.update - Method called with (eventType, payload) on events
	 * 
	 * @example
	 * manager.subscribe('https://api.example.com/data', {
	 *   update: (eventType, payload) => {
	 *     console.log('Event:', eventType, payload);
	 *   }
	 * });
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
	 * 
	 * @example
	 * if (manager.isLoading('https://api.example.com/data')) {
	 *   console.log('Request in progress...');
	 * }
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
	 * @returns {*|null} Cached data or null if not found or expired
	 * 
	 * @example
	 * const cached = manager.getCachedData('https://api.example.com/data');
	 * if (cached) {
	 *   console.log('Using cached data:', cached);
	 * } else {
	 *   const fresh = await manager.fetch('https://api.example.com/data');
	 * }
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
	 * 
	 * @example
	 * // Clear specific URL cache
	 * manager.clearCache('https://api.example.com/data');
	 * 
	 * @example
	 * // Clear all cache
	 * manager.clearCache();
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
	 * 
	 * @example
	 * // Clean up when component unmounts
	 * useEffect(() => {
	 *   return () => {
	 *     manager.destroy();
	 *   };
	 * }, []);
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
	 * @returns {ManagerStats} Statistics object with current state information
	 * 
	 * @example
	 * const stats = manager.getStats();
	 * console.log(`Cache: ${stats.cacheSize}/${stats.maxCacheSize} (${stats.cacheUtilization}%)`);
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
	 * 
	 * @example
	 * // Force cleanup before important operation
	 * manager.triggerCleanup();
	 */
	triggerCleanup() {
		this._performPeriodicCleanup();
	}

	/**
	 * Set cache expiration time for new entries
	 * 
	 * @param {number} milliseconds - Cache expiration time in milliseconds
	 * 
	 * @example
	 * // Set cache expiration to 10 minutes
	 * manager.setCacheExpiration(10 * 60 * 1000);
	 */
	setCacheExpiration(milliseconds) {
		this.cacheExpiration = milliseconds;
	}

	/**
	 * Set maximum cache size
	 * 
	 * @param {number} size - Maximum number of cache entries
	 * 
	 * @example
	 * // Increase cache size for better performance
	 * manager.setMaxCacheSize(500);
	 */
	setMaxCacheSize(size) {
		this.maxCacheSize = size;
		// Immediately enforce the new limit
		this._enforceCacheSizeLimit();
	}

	/**
	 * Set default retry configuration for new fetchers
	 * 
	 * @param {RetryConfig} [retryConfig={}] - Retry configuration object
	 * 
	 * @example
	 * manager.setRetryConfig({
	 *   maxRetries: 5,
	 *   retryDelay: 2000,
	 *   retryMultiplier: 1.5
	 * });
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
	 * @returns {RetryConfig} Current retry configuration
	 * 
	 * @example
	 * const config = manager.getRetryConfig();
	 * console.log(`Max retries: ${config.maxRetries}`);
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
	 * @param {RetryConfig} [retryConfig={}] - Retry configuration object
	 * 
	 * @example
	 * // Set higher retries for critical endpoint
	 * manager.setRetryConfigForUrl('https://api.example.com/critical', {
	 *   maxRetries: 10,
	 *   retryDelay: 500
	 * });
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
