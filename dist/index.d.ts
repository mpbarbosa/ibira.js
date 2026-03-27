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
interface CacheEntry<T = unknown> {
    readonly data: T;
    readonly timestamp: number;
    readonly expiresAt: number;
}
/**
 * @typedef {Object} CacheOptions
 * @property {number} [maxSize=50] - Maximum number of cache entries
 * @property {number} [expiration=300000] - Cache expiration time in milliseconds (default: 5 minutes)
 */
interface CacheOptions {
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
declare class DefaultCache<T = unknown> {
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
    constructor(options?: CacheOptions);
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
    has(key: string): boolean;
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
    get(key: string): CacheEntry<T> | undefined;
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
    set(key: string, value: CacheEntry<T>): void;
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
    delete(key: string): boolean;
    /**
     * Clears all entries from the cache
     *
     * @example
     * cache.clear();
     * console.log('Cache cleared, size:', cache.size);
     */
    clear(): void;
    /**
     * Gets the current number of entries in the cache
     *
     * @returns {number} The number of cached entries
     *
     * @example
     * console.log(`Cache has ${cache.size} entries`);
     */
    get size(): number;
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
    entries(): IterableIterator<[string, CacheEntry<T>]>;
    /**
     * Enforces the maximum cache size by removing oldest entries
     * Uses LRU (Least Recently Used) eviction strategy
     *
     * @private
     */
    private _enforceSizeLimit;
}

/**
 * @fileoverview Default event notification system with observer pattern
 * @module utils/DefaultEventNotifier
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */
/**
 * @typedef {Object} Observer
 * @property {Function} update - Method called with (eventType, payload) when events occur
 */
interface Observer {
    update: (...args: unknown[]) => void;
}
/**
 * DefaultEventNotifier - Observer pattern implementation for event notifications
 *
 * Built on top of {@link DualObserverSubject} from
 * [bessa_patterns.ts](https://github.com/mpbarbosa/bessa_patterns.ts)
 * (v0.12.15-alpha), which provides the immutable-array observer management,
 * null-safety, and per-observer error isolation.
 *
 * Wraps the `DualObserverSubject` GoF channel with the ibira.js-specific
 * `notify()` / `clear()` / `subscriberCount` surface so the rest of the
 * codebase stays unchanged.
 *
 * **Supported Events:**
 * - 'loading-start': Fired when a fetch operation begins
 * - 'success': Fired when data is successfully fetched
 * - 'error': Fired when an error occurs during fetching
 *
 * @class DefaultEventNotifier
 * @since 0.1.0-alpha
 * @author Marcelo Pereira Barbosa
 *
 * @example
 * const notifier = new DefaultEventNotifier();
 *
 * notifier.subscribe({
 *   update: (event, data) => {
 *     console.log('Event:', event, 'Data:', data);
 *   }
 * });
 *
 * notifier.notify('success', { result: 'data' });
 */
declare class DefaultEventNotifier {
    private readonly _subject;
    /**
     * Creates a new DefaultEventNotifier instance
     *
     * @example
     * const notifier = new DefaultEventNotifier();
     */
    constructor();
    /**
     * Read-only view of the currently subscribed observers.
     *
     * @type {ReadonlyArray<Observer>}
     */
    get observers(): ReadonlyArray<Observer>;
    /**
     * Subscribes an observer to receive notifications
     *
     * @param {Observer | null | undefined} observer - Observer object with an update method
     *
     * @example
     * notifier.subscribe({
     *   update: (event, data) => {
     *     if (event === 'loading-start') console.log('Loading...');
     *     if (event === 'success') console.log('Data:', data);
     *   }
     * });
     */
    subscribe(observer: Observer | null | undefined): void;
    /**
     * Unsubscribes an observer from notifications.
     * Removes all occurrences if the same observer was subscribed multiple times.
     *
     * @param {Observer} observer - Observer object to remove
     *
     * @example
     * const observer = { update: (e, d) => console.log(e, d) };
     * notifier.subscribe(observer);
     * // Later...
     * notifier.unsubscribe(observer);
     */
    unsubscribe(observer: Observer): void;
    /**
     * Notifies all subscribed observers with the provided arguments.
     * Observer errors are isolated — a throwing observer does not prevent
     * subsequent observers from receiving the notification.
     *
     * @param {...unknown} args - Arguments to pass to each observer's update method
     *
     * @example
     * // Notify with event type and payload
     * notifier.notify('success', { data: [1, 2, 3] });
     *
     * @example
     * // Notify with error
     * notifier.notify('error', { error: new Error('Failed') });
     */
    notify(...args: unknown[]): void;
    /**
     * Clears all subscribed observers
     *
     * @example
     * notifier.clear();
     * console.log('Subscribers:', notifier.subscriberCount); // 0
     */
    clear(): void;
    /**
     * Gets the current number of subscribed observers
     *
     * @returns {number} The number of observers
     *
     * @example
     * console.log(`Active observers: ${notifier.subscriberCount}`);
     */
    get subscriberCount(): number;
}

/**
 * @fileoverview Core fetcher class with caching and observer pattern support
 * @module core/IbiraAPIFetcher
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

/** Duck-typed interface for any object that can act as a cache store.
 *
 * @template T - The type of the cached data. Defaults to `unknown` for backward compatibility.
 *   Implement this interface with a specific type to build custom typed cache backends.
 *
 * @example
 * class LocalStorageCache implements CacheInterface<User> { ... }
 */
interface CacheInterface<T = unknown> {
    has(key: string): boolean;
    get(key: string): CacheEntry<T> | undefined | null;
    set(key: string, value: CacheEntry<T>): void;
    delete(key: string): boolean;
    clear(): void;
    readonly size: number;
    entries(): Iterable<[string, CacheEntry<T>]>;
    maxSize: number;
    expiration: number;
}
/** Duck-typed interface for any event notifier implementation. */
interface EventNotifierInterface {
    subscribe(observer: Observer): void;
    unsubscribe(observer: Observer): void;
    notify(...args: unknown[]): void;
    clear(): void;
    readonly subscriberCount: number;
}
/** Union of valid HTTP method strings accepted by FetcherOptions and RetryConfig. */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
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
 * @property {Function} [onRequest] - Request interceptor: `(options: RequestInit) => RequestInit | Promise<RequestInit>`. Called before each fetch attempt; return modified options to add headers, change the body, etc.
 * @property {Function} [onResponse] - Response interceptor: `(response: Response) => Response | Promise<Response>`. Called after each fetch attempt before status validation; return a modified or cloned response.
 * @property {Function} [retryStrategy] - Custom retry predicate: `(attempt: number, error: Error) => boolean`. When provided, replaces the built-in retryable-status check; return `true` to retry, `false` to give up.
 */
interface FetcherOptions {
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
    onRequest?: (options: RequestInit) => RequestInit | Promise<RequestInit>;
    onResponse?: (response: Response) => Response | Promise<Response>;
    retryStrategy?: (attempt: number, error: Error) => boolean;
}
/**
 * @typedef {Object} CacheOperation
 * @property {'set'|'update'|'delete'} type - Type of cache operation
 * @property {string} key - Cache key affected
 * @property {CacheEntry} [value] - New value (for set/update operations)
 */
interface CacheOperation {
    type: 'set' | 'update' | 'delete';
    key: string;
    value?: CacheEntry;
}
/**
 * @typedef {Object} FetchEvent
 * @property {'loading-start'|'success'|'error'} type - Event type
 * @property {*} payload - Event payload data
 */
interface FetchEvent {
    type: 'loading-start' | 'success' | 'error';
    payload: unknown;
}
interface FetchMeta {
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
interface FetchResult {
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
declare class IbiraAPIFetcher {
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
    readonly onRequest: ((options: RequestInit) => RequestInit | Promise<RequestInit>) | null;
    readonly onResponse: ((response: Response) => Response | Promise<Response>) | null;
    readonly retryStrategy: ((attempt: number, error: Error) => boolean) | null;
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
    static withExternalCache(url: string, cache: CacheInterface, options?: FetcherOptions): IbiraAPIFetcher;
    /**
     * Creates a default cache with expiration and size limits
     *
     * @private
     * @static
     * @param {FetcherOptions} [options={}] - Cache configuration options
     * @returns {CacheInterface} Configured cache instance
     */
    private static _createDefaultCache;
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
    static withDefaultCache(url: string, options?: FetcherOptions): IbiraAPIFetcher;
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
    static withoutCache(url: string, options?: FetcherOptions): IbiraAPIFetcher;
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
    static withEventCallback(url: string, eventCallback: (...args: unknown[]) => void, options?: FetcherOptions): IbiraAPIFetcher;
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
    static withoutEvents(url: string, options?: FetcherOptions): IbiraAPIFetcher;
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
    static pure(url: string, options?: FetcherOptions): IbiraAPIFetcher;
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
     * @param {Function} [options.onRequest] - Request interceptor called before each fetch attempt; return modified RequestInit
     * @param {Function} [options.onResponse] - Response interceptor called after each fetch attempt; return modified Response
     * @param {Function} [options.retryStrategy] - Custom retry predicate; return true to retry, false to stop
     */
    constructor(url: string, cache: CacheInterface, options?: FetcherOptions);
    /**
     * Generates a unique cache key for this fetcher.
     * Includes the HTTP method so POST /url and GET /url cache independently.
     *
     * @returns {string} The cache key (`METHOD:url`)
     */
    getCacheKey(): string;
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
    private _createCacheEntry;
    /**
     * Checks if a cache entry is still valid (not expired)
     *
     * @private
     * @param {Object} cacheEntry - The cache entry to check
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {boolean} True if the entry is still valid
     */
    private _isCacheEntryValid;
    /**
     * Identifies expired cache entries that should be removed
     * This is a pure function that returns keys to delete without mutating state
     *
     * @private
     * @param {Map} cache - The cache map to check
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {string[]} Array of cache keys that have expired
     */
    private _getExpiredCacheKeys;
    /**
     * Determines if an error is retryable based on error type and status code
     *
     * @private
     * @param {Error} error - The error to check
     * @returns {boolean} True if the error is retryable
     */
    private _isRetryableError;
    /**
     * Calculates the delay for the next retry attempt using exponential backoff
     *
     * @private
     * @param {number} attempt - The current attempt number (0-based)
     * @returns {number} Delay in milliseconds
     */
    private _calculateRetryDelay;
    /**
     * Sleeps for the specified number of milliseconds
     *
     * @private
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>} Promise that resolves after the delay
     */
    private _sleep;
    /**
     * Performs a single network request with timeout handling
     *
     * @private
     * @param {AbortController} abortController - Controller for request cancellation
     * @param {AbortSignal} [externalSignal] - Optional external signal for consumer-level cancellation
     * @returns {Promise<any>} Promise that resolves to the fetched data
     */
    private _performSingleRequest;
    /**
     * Subscribes an observer to receive event notifications
     *
     * @param {Observer} observer - Observer object with an update method
     */
    subscribe(observer: Observer): void;
    /**
     * Unsubscribes an observer from event notifications
     *
     * @param {Observer} observer - Observer object to remove
     */
    unsubscribe(observer: Observer): void;
    /**
     * Notifies all subscribed observers with event data
     *
     * @param {...*} args - Arguments to pass to observers (typically eventType and payload)
     */
    notifyObservers(...args: unknown[]): void;
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
    fetchDataPure(currentCacheState: Map<string, CacheEntry> | CacheInterface, currentTime?: number, networkProvider?: (() => Promise<unknown>) | null, signal?: AbortSignal | null): Promise<FetchResult>;
    /**
     * Pure function to apply cache size limits without mutations
     *
     * @private
     * @param {Map} cacheState - Current cache state
     * @returns {Map} New cache state with size limits applied
     */
    private _applyCacheSizeLimitsPure;
    /**
     * Pure function to calculate what cache evictions occurred
     *
     * @private
     * @param {Map} beforeState - Cache state before size limits
     * @param {Map} afterState - Cache state after size limits
     * @returns {Array} Array of eviction operations
     */
    private _calculateCacheEvictions;
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
     * @returns {Promise<unknown>} Resolves with the fetched data, or retrieved from cache
     * @throws {Error} Thrown after all retry attempts are exhausted. Possible causes:
     *   - Network errors (e.g. `TypeError: Failed to fetch`)
     *   - HTTP error responses not matching `validateStatus` (e.g. `HTTP error! status: 500`)
     *   - JSON parsing errors from `response.json()`
     *   - Errors thrown by `onRequest` or `onResponse` interceptors
     *   - `AbortError` when `signal` is aborted externally (not retried)
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
    fetchData(cacheOverride?: CacheInterface | null, signal?: AbortSignal | null): Promise<unknown>;
    /**
     * Applies side effects based on pure computation results
     *
     * @private
     * @param {FetchResult} result - Result from fetchDataPure
     * @param {Object} activeCache - Cache to apply operations to
     */
    private _applySideEffects;
}

/**
 * @fileoverview Manager for coordinating multiple concurrent API fetch operations
 * @module core/IbiraAPIFetchManager
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */

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
interface ManagerOptions {
    maxCacheSize?: number;
    cacheExpiration?: number;
    cleanupInterval?: number;
    maxRetries?: number;
    retryDelay?: number;
    retryMultiplier?: number;
    retryableStatusCodes?: number[];
}
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
interface ManagerStats {
    activeFetchers: number;
    pendingRequests: number;
    cacheSize: number;
    maxCacheSize: number;
    expiredEntries: number;
    cacheUtilization: number;
    lastCleanup: string;
    cacheExpiration: number;
}
/**
 * @typedef {Object} RetryConfig
 * @property {number} [maxRetries] - Maximum number of retry attempts
 * @property {number} [retryDelay] - Initial retry delay in milliseconds
 * @property {number} [retryMultiplier] - Exponential backoff multiplier
 * @property {number[]} [retryableStatusCodes] - HTTP status codes that should trigger retries
 */
interface RetryConfig {
    maxRetries?: number;
    retryDelay?: number;
    retryMultiplier?: number;
    retryableStatusCodes?: number[];
    method?: HttpMethod;
}
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
declare class IbiraAPIFetchManager {
    fetchers: Map<string, IbiraAPIFetcher>;
    pendingRequests: Map<string, Promise<unknown>>;
    globalCache: Map<string, CacheEntry> & {
        maxSize: number;
        expiration: number;
    };
    maxCacheSize: number;
    cacheExpiration: number;
    cleanupInterval: number;
    lastCleanup: number;
    defaultMaxRetries: number;
    defaultRetryDelay: number;
    defaultRetryMultiplier: number;
    defaultRetryableStatusCodes: number[];
    cleanupTimer: ReturnType<typeof setInterval> | null;
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
    constructor(options?: ManagerOptions);
    /**
     * Creates or retrieves a fetcher instance for the given URL and method.
     *
     * @param {string} url - The API endpoint URL
     * @param {Object} [options={}] - Configuration options for the fetcher
     * @param {number} [options.timeout] - Request timeout in milliseconds
     * @param {number} [options.maxRetries] - Maximum number of retry attempts
     * @param {number} [options.retryDelay] - Initial retry delay in milliseconds
     * @param {number} [options.retryMultiplier] - Exponential backoff multiplier
     * @param {number[]} [options.retryableStatusCodes] - HTTP status codes that should trigger retries
     * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'HEAD'} [options.method='GET'] - HTTP method
     * @param {Object|string|FormData|Blob|null} [options.body=null] - Request body
     * @param {Object} [options.headers={}] - Additional request headers
     * @returns {IbiraAPIFetcher} The fetcher instance for this URL + method combination
     *
     * @example
     * const fetcher = manager.getFetcher('https://api.example.com/data', {
     *   timeout: 5000,
     *   maxRetries: 5
     * });
     */
    getFetcher(url: string, options?: FetcherOptions): IbiraAPIFetcher;
    /**
     * Starts periodic cleanup of expired cache entries
     *
     * @private
     */
    private _startPeriodicCleanup;
    /**
     * Identifies expired cache entries that should be removed
     * This is a pure function that returns keys to delete without mutating state
     *
     * @private
     * @param {Map} cache - The cache map to check
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {string[]} Array of cache keys that have expired
     */
    private _getExpiredCacheKeys;
    /**
     * Performs periodic cleanup of expired cache entries and enforces size limits
     *
     * @private
     */
    private _performPeriodicCleanup;
    /**
     * Enforces cache size limits by removing oldest entries
     * Uses LRU (Least Recently Used) eviction strategy
     *
     * @private
     */
    private _enforceCacheSizeLimit;
    /**
     * Checks if a cache entry is still valid (not expired)
     *
     * @private
     * @param {Object} cacheEntry - The cache entry to check
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {boolean} True if the entry is still valid
     */
    private _isCacheEntryValid;
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
     * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'HEAD'} [options.method='GET'] - HTTP method
     * @param {Object|string|FormData|Blob|null} [options.body=null] - Request body (plain objects auto-serialized to JSON)
     * @param {Object} [options.headers={}] - Additional request headers
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
    fetch(url: string, options?: FetcherOptions): Promise<unknown>;
    /**
     * Internal method to execute the actual fetch operation
     *
     * @private
     * @async
     * @param {IbiraAPIFetcher} fetcher - The fetcher instance to use
     * @returns {Promise<*>} Promise that resolves to the fetched data
     */
    private _executeFetch;
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
    fetchMultiple(urls: string[], options?: FetcherOptions): Promise<PromiseSettledResult<unknown>[]>;
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
    subscribe(url: string, observer: Observer): void;
    /**
     * Unsubscribe from updates from a specific fetcher
     *
     * @param {string} url - The URL of the fetcher to unsubscribe from
     * @param {Object} observer - Observer object to remove
     */
    unsubscribe(url: string, observer: Observer): void;
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
    isLoading(url: string): boolean;
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
    getCachedData(url: string): unknown | null;
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
    clearCache(url?: string | null): void;
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
    destroy(): void;
    /**
     * Get statistics about the current state of the manager
     *
     * @returns {ManagerStats} Statistics object with current state information
     *
     * @example
     * const stats = manager.getStats();
     * console.log(`Cache: ${stats.cacheSize}/${stats.maxCacheSize} (${stats.cacheUtilization}%)`);
     */
    getStats(): ManagerStats;
    /**
     * Manually trigger cache cleanup
     * Useful for testing or when you want to force cleanup
     *
     * @example
     * // Force cleanup before important operation
     * manager.triggerCleanup();
     */
    triggerCleanup(): void;
    /**
     * Set cache expiration time for new entries
     *
     * @param {number} milliseconds - Cache expiration time in milliseconds
     *
     * @example
     * // Set cache expiration to 10 minutes
     * manager.setCacheExpiration(10 * 60 * 1000);
     */
    setCacheExpiration(milliseconds: number): void;
    /**
     * Set maximum cache size
     *
     * @param {number} size - Maximum number of cache entries
     *
     * @example
     * // Increase cache size for better performance
     * manager.setMaxCacheSize(500);
     */
    setMaxCacheSize(size: number): void;
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
    setRetryConfig(retryConfig?: RetryConfig): void;
    /**
     * Get current retry configuration
     *
     * @returns {RetryConfig} Current retry configuration
     *
     * @example
     * const config = manager.getRetryConfig();
     * console.log(`Max retries: ${config.maxRetries}`);
     */
    getRetryConfig(): RetryConfig;
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
    setRetryConfigForUrl(url: string, retryConfig?: RetryConfig): void;
}

/**
 * @fileoverview Throttle higher-order function — limits how often a function can be called
 * @module utils/throttle
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */
/**
 * A throttled function with an additional `flush()` method that resets the cooldown
 * so the next call executes immediately.
 *
 * @template TArgs - Tuple of argument types of the wrapped function
 * @template TReturn - Return type of the wrapped function
 */
interface ThrottledFunction<TArgs extends unknown[], TReturn> {
    /**
     * Calls the wrapped function if the cooldown has elapsed; returns `undefined` otherwise.
     */
    (...args: TArgs): TReturn | undefined;
    /**
     * Resets the internal timestamp so the next call executes immediately regardless of the
     * elapsed time since the last execution.
     */
    flush(): void;
}
/**
 * Creates a throttled version of `fn` that executes at most once per `wait` milliseconds
 * (leading-edge strategy: the first call in each window fires immediately).
 *
 * Calls made while the cooldown is active are silently dropped and return `undefined`.
 * Use the returned `flush()` method to reset the cooldown on demand.
 *
 * @template TArgs - Tuple of argument types of the wrapped function
 * @template TReturn - Return type of the wrapped function
 *
 * @param {(...args: TArgs) => TReturn} fn - The function to throttle
 * @param {number} wait - Minimum milliseconds between executions (must be ≥ 0)
 * @returns {ThrottledFunction<TArgs, TReturn>} Throttled wrapper with a `flush()` escape hatch
 *
 * @throws {TypeError} When `fn` is not a function or `wait` is not a non-negative number
 *
 * @example
 * // Rate-limit a fetch to at most one request per second
 * import { IbiraAPIFetcher } from 'ibira.js';
 * import { throttle } from 'ibira.js/utils';
 *
 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
 * const throttledFetch = throttle(fetcher.fetchData.bind(fetcher), 1000);
 *
 * // Only the first call per second reaches the network; others return undefined
 * const result = await throttledFetch(); // executes
 * const dropped = throttledFetch();     // undefined — within cooldown
 *
 * @example
 * // Force the next call through regardless of the cooldown
 * throttledFetch.flush();
 * const fresh = await throttledFetch(); // executes immediately
 *
 * @since 0.4.20-alpha
 */
declare function throttle<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn, wait: number): ThrottledFunction<TArgs, TReturn>;

/**
 * @fileoverview Debounce higher-order function — delays execution until activity stops
 * @module utils/debounce
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */
/**
 * A debounced function with additional control methods.
 *
 * @template TArgs - Tuple of argument types of the wrapped function
 * @template TReturn - Return type of the wrapped function
 */
interface DebouncedFunction<TArgs extends unknown[], TReturn> {
    /**
     * Resets the wait timer. All callers in the current window share the same Promise,
     * which resolves (or rejects) once the trailing-edge invocation completes.
     */
    (...args: TArgs): Promise<TReturn>;
    /**
     * Cancels the pending invocation. All Promises already returned by this debounced
     * function will remain pending indefinitely — callers should check `cancel()` is
     * appropriate before calling it.
     */
    cancel(): void;
    /**
     * Forces the debounced function to execute immediately with the most recently supplied
     * arguments, resolving all pending Promises. No-op when there is no pending invocation.
     */
    flush(): void;
}
/**
 * Creates a debounced version of `fn` that delays invocation until `wait` milliseconds
 * have elapsed since the **last** call (trailing-edge strategy).
 *
 * All calls made within the same wait window share a single Promise: when the debounced
 * function eventually fires, every caller's Promise resolves (or rejects) with the same
 * result. This makes it safe to `await` the debounced function in multiple places.
 *
 * @template TArgs - Tuple of argument types of the wrapped function
 * @template TReturn - Return type of the wrapped function
 *
 * @param {(...args: TArgs) => TReturn | Promise<TReturn>} fn - The function to debounce
 * @param {number} wait - Milliseconds to wait after the last call before executing (must be ≥ 0)
 * @returns {DebouncedFunction<TArgs, TReturn>} Debounced wrapper with `cancel()` and `flush()` methods
 *
 * @throws {TypeError} When `fn` is not a function or `wait` is not a non-negative number
 *
 * @example
 * // Search-as-you-type: fetch only after the user stops typing for 300 ms
 * import { IbiraAPIFetcher } from 'ibira.js';
 * import { debounce } from 'ibira.js/utils';
 *
 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/search');
 * const debouncedFetch = debounce(fetcher.fetchData.bind(fetcher), 300);
 *
 * searchInput.addEventListener('input', async () => {
 *   const results = await debouncedFetch(); // only the final keystroke triggers a request
 *   renderResults(results);
 * });
 *
 * @example
 * // Cancel a pending request before navigation
 * window.addEventListener('beforeunload', () => debouncedFetch.cancel());
 *
 * @example
 * // Force immediate execution regardless of the wait timer
 * submitButton.addEventListener('click', () => debouncedFetch.flush());
 *
 * @since 0.4.20-alpha
 */
declare function debounce<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn | Promise<TReturn>, wait: number): DebouncedFunction<TArgs, TReturn>;

/**
 * @fileoverview Semantic versioning configuration for ibira.js
 * @module config/version
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 * @see {@link https://semver.org/|Semantic Versioning 2.0.0}
 */
/**
 * Semantic version object following SemVer 2.0.0 specification
 *
 * The version format is MAJOR.MINOR.PATCH-PRERELEASE where:
 * - MAJOR version increments for incompatible API changes
 * - MINOR version increments for backward-compatible new features
 * - PATCH version increments for backward-compatible bug fixes
 * - PRERELEASE identifier indicates unstable development (alpha, beta, rc)
 *
 * @constant
 * @type {Object}
 * @property {number} major - Major version number (breaking changes)
 * @property {number} minor - Minor version number (new features, backward compatible)
 * @property {number} patch - Patch version number (bug fixes)
 * @property {string} prerelease - Prerelease identifier (alpha, beta, rc)
 * @property {Function} toString - Returns the full version string
 *
 * @example
 * import { VERSION } from 'ibira.js';
 * console.log(VERSION.toString()); // "0.4.22-alpha"
 * console.log(`v${VERSION.major}.${VERSION.minor}.${VERSION.patch}`);
 */
declare const VERSION: {
    major: number;
    minor: number;
    patch: number;
    prerelease: string;
    toString(): string;
};

export { type CacheEntry, type CacheInterface, type CacheOperation, type CacheOptions, DefaultCache, DefaultEventNotifier, type FetchEvent, type FetchMeta, type FetchResult, type FetcherOptions, type HttpMethod, IbiraAPIFetchManager, IbiraAPIFetcher, VERSION, debounce, throttle };
