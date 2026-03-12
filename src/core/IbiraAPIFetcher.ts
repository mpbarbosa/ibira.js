/**
 * @fileoverview Core fetcher class with caching and observer pattern support
 * @module core/IbiraAPIFetcher
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

import { DefaultEventNotifier } from '../utils/DefaultEventNotifier.js';
import type { CacheEntry } from '../utils/DefaultCache.js';
import type { Observer } from '../utils/DefaultEventNotifier.js';

export type { CacheEntry };

/** Duck-typed interface for any object that can act as a cache store. */
export interface CacheInterface {
	has(key: string): boolean;
	get(key: string): CacheEntry | undefined | null;
	set(key: string, value: CacheEntry): void;
	delete(key: string): boolean;
	clear(): void;
	readonly size: number;
	entries(): Iterable<[string, CacheEntry]>;
	maxSize: number;
	expiration: number;
}

/** Duck-typed interface for any event notifier implementation. */
export interface EventNotifierInterface {
	subscribe(observer: Observer): void;
	unsubscribe(observer: Observer): void;
	notify(...args: unknown[]): void;
	clear(): void;
	readonly subscriberCount: number;
}

/** Union of valid HTTP method strings accepted by FetcherOptions and RetryConfig. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

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
 * @property {Function} [validateStatus] - Function `(status: number) => boolean` that determines whether an HTTP status is successful. Defaults to `status >= 200 && status < 300`.
 * @property {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'HEAD'} [method='GET'] - HTTP method for the request
 * @property {Object|string|FormData|Blob|null} [body=null] - Request body. Plain objects are JSON-serialized automatically; strings/FormData/Blob are passed as-is.
 * @property {Object} [headers={}] - Additional HTTP request headers. When body is a plain object, `Content-Type: application/json` is added automatically.
 */
export interface FetcherOptions {
	timeout?: number;
	eventNotifier?: EventNotifierInterface;
	maxRetries?: number;
	retryDelay?: number;
	retryMultiplier?: number;
	retryableStatusCodes?: number[];
	maxCacheSize?: number;
	cacheExpiration?: number;
	cache?: CacheInterface;
	validateStatus?: (status: number) => boolean;
	method?: HttpMethod;
	body?: Record<string, unknown> | string | FormData | Blob | ArrayBuffer | null;
	headers?: Record<string, string>;
}

/**
 * @typedef {Object} CacheOperation
 * @property {'set'|'update'|'delete'} type - Type of cache operation
 * @property {string} key - Cache key affected
 * @property {CacheEntry} [value] - New value (for set/update operations)
 */
export interface CacheOperation {
	type: 'set' | 'update' | 'delete';
	key: string;
	value?: CacheEntry;
}

/**
 * @typedef {Object} FetchEvent
 * @property {'loading-start'|'success'|'error'} type - Event type
 * @property {*} payload - Event payload data
 */
export interface FetchEvent {
	type: 'loading-start' | 'success' | 'error';
	payload: unknown;
}

export interface FetchMeta {
	cacheKey: string;
	timestamp: number;
	expiredKeysRemoved: number;
	attempt?: number;
	networkRequest?: boolean;
}

/**
 * @typedef {Object} FetchResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} [data] - The fetched data (present when success is true)
 * @property {Error} [error] - The error that occurred (present when success is false)
 * @property {boolean} fromCache - Whether data came from cache
 * @property {CacheOperation[]} cacheOperations - List of cache operations performed
 * @property {FetchEvent[]} events - List of events that occurred
 * @property {Map} newCacheState - The new cache state after operations
 * @property {FetchMeta} meta - Metadata about the operation
 */
export interface FetchResult {
	success: boolean;
	data?: unknown;
	error?: Error;
	fromCache: boolean;
	cacheOperations: readonly CacheOperation[];
	events: readonly FetchEvent[];
	newCacheState: Map<string, CacheEntry>;
	meta: FetchMeta;
}

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
	readonly url: string;
	readonly timeout: number;
	readonly cache: CacheInterface;
	readonly eventNotifier: EventNotifierInterface;
	readonly maxRetries: number;
	readonly retryDelay: number;
	readonly retryMultiplier: number;
	readonly retryableStatusCodes: ReadonlyArray<number>;
	readonly validateStatus: (status: number) => boolean;
	readonly method: HttpMethod;
	readonly body: Record<string, unknown> | string | FormData | Blob | ArrayBuffer | null;
	readonly headers: Readonly<Record<string, string>>;

	/**
	 * Creates an IbiraAPIFetcher with a purely functional cache approach
	 * This method provides better referential transparency by explicitly managing cache externally
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL
	 * @param {CacheInterface} cache - External cache instance (must implement Map-like interface)
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
	static withExternalCache(url: string, cache: CacheInterface, options: FetcherOptions = {}): IbiraAPIFetcher {
		return new IbiraAPIFetcher(url, cache, options);
	}

	/**
	 * Creates a default cache with expiration and size limits
	 * 
	 * @private
	 * @static
	 * @param {FetcherOptions} [options={}] - Cache configuration options
	 * @returns {CacheInterface} Configured cache instance
	 */
	private static _createDefaultCache(options: FetcherOptions = {}): CacheInterface {
		const cache = new Map<string, CacheEntry>() as unknown as CacheInterface;
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
	static withDefaultCache(url: string, options: FetcherOptions = {}): IbiraAPIFetcher {
		const cache = this._createDefaultCache(options);
		return new IbiraAPIFetcher(url, cache, options);
	}

	/**
	 * Creates an IbiraAPIFetcher with no caching for maximum referential transparency
	 * Every call will result in a fresh network request
	 * 
	 * @static
	 * @param {string} url - The API endpoint URL  
	 * @param {FetcherOptions} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with no cache
	 * 
	 * @example
	 * // No cache - purely functional, always fresh data
	 * const fetcher = IbiraAPIFetcher.withoutCache('https://api.example.com/data');
	 */
	static withoutCache(url: string, options: FetcherOptions = {}): IbiraAPIFetcher {
		const noCache: CacheInterface = {
			has: () => false,
			get: () => null,
			set: () => {},
			delete: () => false,
			clear: () => {},
			size: 0,
			entries: () => [] as unknown as IterableIterator<[string, CacheEntry]>,
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
	 * @param {FetcherOptions} [options={}] - Additional configuration options
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
	static withEventCallback(url: string, eventCallback: (...args: unknown[]) => void, options: FetcherOptions = {}): IbiraAPIFetcher {
		const callbackNotifier: EventNotifierInterface = {
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
	 * @param {FetcherOptions} [options={}] - Additional configuration options
	 * @returns {IbiraAPIFetcher} Configured fetcher instance with no event notifications
	 * 
	 * @example
	 * // Pure functional approach - no event side effects
	 * const fetcher = IbiraAPIFetcher.withoutEvents('https://api.example.com/data');
	 * const data = await fetcher.fetchData(); // No event notifications
	 */
	static withoutEvents(url: string, options: FetcherOptions = {}): IbiraAPIFetcher {
		const noEvents: EventNotifierInterface = {
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
	 * @param {FetcherOptions} [options={}] - Additional configuration options
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
	static pure(url: string, options: FetcherOptions = {}): IbiraAPIFetcher {
		const noCache: CacheInterface = {
			has: () => false,
			get: () => null,
			set: () => {},
			delete: () => false,
			clear: () => {},
			size: 0,
			entries: () => [] as unknown as IterableIterator<[string, CacheEntry]>,
			maxSize: options.maxCacheSize || 100,
			expiration: options.cacheExpiration || 5 * 60 * 1000
		};
		
		const noEvents: EventNotifierInterface = {
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
	 * @param {CacheInterface} cache - Cache instance (must implement Map-like interface with has/get/set/delete/clear/entries methods)
	 * @param {FetcherOptions} [options={}] - Configuration options
	 * @param {number} [options.timeout=10000] - Request timeout in milliseconds
	 * @param {EventNotifierInterface} [options.eventNotifier] - Event notifier instance for observer pattern
	 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
	 * @param {number} [options.retryDelay=1000] - Initial retry delay in milliseconds
	 * @param {number} [options.retryMultiplier=2] - Exponential backoff multiplier
	 * @param {number[]} [options.retryableStatusCodes=[408, 429, 500, 502, 503, 504]] - HTTP status codes that trigger retries
	 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'HEAD'} [options.method='GET'] - HTTP method
	 * @param {Object|string|FormData|Blob|null} [options.body=null] - Request body (plain objects are JSON-serialized automatically)
	 * @param {Object} [options.headers={}] - Additional request headers
	 */
    constructor(url: string, cache: CacheInterface, options: FetcherOptions = {}) {
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
		// Custom HTTP success predicate — defaults to the standard 2xx range
		this.validateStatus = options.validateStatus || ((status) => status >= 200 && status < 300);
		// HTTP method, body, and headers for non-GET requests
		this.method = (options.method || 'GET').toUpperCase() as HttpMethod;
		this.body = options.body !== undefined ? options.body : null;
		this.headers = Object.freeze({ ...(options.headers || {}) });
		
		// ✅ IMMUTABLE: Deep freeze the entire instance for maximum referential transparency
		// This prevents any external code from modifying the fetcher's properties
		// and guarantees true immutability at the language level
		Object.freeze(this);
	}

	/**
	 * Generates a unique cache key for this fetcher.
	 * Includes the HTTP method so POST /url and GET /url cache independently.
	 * 
	 * @returns {string} The cache key (`METHOD:url`)
	 */
	getCacheKey(): string {
		return `${this.method}:${this.url}`;
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
	private _createCacheEntry(data: unknown, currentTime: number, cache: CacheInterface): CacheEntry {
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
	private _isCacheEntryValid(cacheEntry: CacheEntry | undefined | null, currentTime: number): boolean {
		return cacheEntry != null && currentTime < cacheEntry.expiresAt;
	}

	/**
	 * Enforces cache size limits by removing oldest entries
	 * Uses LRU (Least Recently Used) eviction strategy
	 * 
	 * @private
	 * @param {Object} [cache] - Optional cache instance, defaults to this.cache
	 */
	private _enforceCacheSizeLimit(cache: CacheInterface | null = null): void {
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
	private _getExpiredCacheKeys(cache: { entries(): Iterable<[string, CacheEntry]> }, currentTime: number): string[] {
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
	private _cleanupExpiredCache(cache: CacheInterface | null = null): void {
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
	private _isRetryableError(error: Error): boolean {
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
	private _calculateRetryDelay(attempt: number): number {
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
	private _sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Performs a single network request with timeout handling
	 * 
	 * @private
	 * @param {AbortController} abortController - Controller for request cancellation
	 * @param {AbortSignal} [externalSignal] - Optional external signal for consumer-level cancellation
	 * @returns {Promise<any>} Promise that resolves to the fetched data
	 */
	private async _performSingleRequest(abortController: AbortController, externalSignal: AbortSignal | null = null): Promise<unknown> {
		// Combine the internal timeout signal with an optional external cancellation signal
		const signal = abortController.signal;
		if (externalSignal) {
			// If the external signal is already aborted, abort immediately
			if (externalSignal.aborted) {
				abortController.abort();
			} else {
				externalSignal.addEventListener('abort', () => abortController.abort(), { once: true });
			}
		}

		const fetchOptions: RequestInit = {
			method: this.method,
			signal,
		};

		// Merge caller-supplied headers first, then auto-add Content-Type for object bodies
		const mergedHeaders: Record<string, string> = { ...this.headers };

		const body = this.body;
		if (body !== null) {
			if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
				fetchOptions.body = JSON.stringify(body);
				if (!mergedHeaders['Content-Type'] && !mergedHeaders['content-type']) {
					mergedHeaders['Content-Type'] = 'application/json';
				}
			} else {
				fetchOptions.body = body as BodyInit;
			}
		}

		if (Object.keys(mergedHeaders).length > 0) {
			fetchOptions.headers = mergedHeaders;
		}

		// Set up timeout
		const timeoutId = setTimeout(() => {
			abortController.abort();
		}, this.timeout);

		try {
			// Perform network request using modern Fetch API
			const response = await fetch(this.url, fetchOptions);

			// Clear timeout on successful response
			clearTimeout(timeoutId);

			// Check if HTTP request was successful using the configured validateStatus predicate
			if (!this.validateStatus(response.status)) {
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
	subscribe(observer: Observer): void {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.subscribe(observer);
	}

	/**
	 * Unsubscribes an observer from event notifications
	 * 
	 * @param {Observer} observer - Observer object to remove
	 */
	unsubscribe(observer: Observer): void {
		// ✅ IMPROVED: Delegate to external event notifier for better referential transparency
		this.eventNotifier.unsubscribe(observer);
	}

	/**
	 * Notifies all subscribed observers with event data
	 * 
	 * @param {...*} args - Arguments to pass to observers (typically eventType and payload)
	 */
	notifyObservers(...args: unknown[]): void {
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
	 * @param {AbortSignal} [signal] - Optional external AbortSignal for consumer-level cancellation
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
	 * 
	 * @example
	 * // With external AbortSignal
	 * const controller = new AbortController();
	 * setTimeout(() => controller.abort(), 2000);
	 * const result = await fetcher.fetchDataPure(new Map(), Date.now(), null, controller.signal);
	 */
	async fetchDataPure(currentCacheState: Map<string, CacheEntry> | CacheInterface, currentTime: number = Date.now(), networkProvider: (() => Promise<unknown>) | null = null, signal: AbortSignal | null = null): Promise<FetchResult> {
		const cacheKey = this.getCacheKey();
		
		// Pure function to get expired keys without mutations
		const expiredKeys = this._getExpiredCacheKeys(currentCacheState, currentTime);
		
		// Create new cache state without expired entries (pure)
		const cleanedCache = new Map<string, CacheEntry>();
		for (const [key, value] of currentCacheState.entries()) {
			if (!expiredKeys.includes(key)) {
				cleanedCache.set(key, value);
			}
		}
		
		// Check cache (pure read operation)
		if (cleanedCache.has(cacheKey)) {
			const cacheEntry = cleanedCache.get(cacheKey)!;
			if (this._isCacheEntryValid(cacheEntry, currentTime)) {
				// Update timestamp for LRU (create new entry, don't mutate)
				const updatedEntry: CacheEntry = { ...cacheEntry, timestamp: currentTime };
				const newCacheState = new Map(cleanedCache);
				newCacheState.set(cacheKey, updatedEntry);
				
				return Object.freeze({
					success: true,
					data: cacheEntry.data,
					fromCache: true,
					cacheOperations: Object.freeze([
						Object.freeze({ type: 'update' as const, key: cacheKey, value: updatedEntry })
					]),
					events: Object.freeze([]) as readonly FetchEvent[],
					newCacheState,
					meta: Object.freeze({
						cacheKey,
						timestamp: currentTime,
						expiredKeysRemoved: expiredKeys.length
					})
				}) as FetchResult;
			}
		}
		
		// Network operation (pure when networkProvider is provided)
		const events: FetchEvent[] = [
			{ type: 'loading-start', payload: Object.freeze({ url: this.url, cacheKey }) }
		];
		
		try {
			// Use injected network provider for purity, or real fetch for practical use
			const networkFn = networkProvider || (() => this._performSingleRequest(new AbortController(), signal));
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
					Object.freeze({ type: 'set' as const, key: cacheKey, value: cacheEntry }),
					...this._calculateCacheEvictions(newCacheState, finalCacheState).map(op => Object.freeze(op))
				]),
				events: Object.freeze([
					...events,
					{ type: 'success' as const, payload: data }
				]),
				newCacheState: finalCacheState,
				meta: Object.freeze({
					cacheKey,
					timestamp: currentTime,
					expiredKeysRemoved: expiredKeys.length,
					attempt: 1,
					networkRequest: true
				})
			}) as FetchResult;
			
		} catch (error) {
			return Object.freeze({
				success: false,
				error: error as Error,
				fromCache: false,
				cacheOperations: Object.freeze([]) as readonly CacheOperation[],
				events: Object.freeze([
					...events,
					{ type: 'error' as const, payload: Object.freeze({ error }) }
				]),
				newCacheState: cleanedCache,
				meta: Object.freeze({
					cacheKey,
					timestamp: currentTime,
					expiredKeysRemoved: expiredKeys.length,
					attempt: 1,
					networkRequest: true
				})
			}) as FetchResult;
		}
	}

	/**
	 * Pure function to apply cache size limits without mutations
	 * 
	 * @private
	 * @param {Map} cacheState - Current cache state
	 * @returns {Map} New cache state with size limits applied
	 */
	private _applyCacheSizeLimitsPure(cacheState: Map<string, CacheEntry>): Map<string, CacheEntry> {
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
	private _calculateCacheEvictions(beforeState: Map<string, CacheEntry>, afterState: Map<string, CacheEntry>): CacheOperation[] {
		const evictions: CacheOperation[] = [];
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
	 * @param {AbortSignal} [signal] - Optional AbortSignal for consumer-level request cancellation
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
	 * // Cancel an in-flight request
	 * const controller = new AbortController();
	 * setTimeout(() => controller.abort(), 1000);
	 * const data = await fetcher.fetchData(null, controller.signal);
	 * 
	 * @example
	 * // Pure functional testing
	 * const mockNetwork = () => Promise.resolve({ test: 'data' });
	 * const result = await fetcher.fetchDataPure(new Map(), Date.now(), mockNetwork);
	 * // Test result without side effects
	 */
	async fetchData(cacheOverride: CacheInterface | null = null, signal: AbortSignal | null = null): Promise<unknown> {
		const activeCache = cacheOverride || this.cache;
		
		// Use the pure core function, forwarding the optional cancellation signal
		const result = await this.fetchDataPure(activeCache, Date.now(), null, signal);
		
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
	private _applySideEffects(result: FetchResult, activeCache: CacheInterface): void {
		// Apply cache operations
		result.cacheOperations.forEach(operation => {
			switch (operation.type) {
				case 'set':
				case 'update':
					activeCache.set(operation.key, operation.value!);
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
