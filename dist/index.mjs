// node_modules/bessa_patterns.ts/dist/index.mjs
var i = class {
  /** Read-only view of object observers subscribed via {@link subscribe}. */
  get observers() {
    return this._observers;
  }
  /** Read-only view of function observers subscribed via {@link subscribeFunction}. */
  get functionObservers() {
    return this._functionObservers;
  }
  /**
   * Creates a new DualObserverSubject with empty observer collections.
   */
  constructor() {
    this._observers = [], this._functionObservers = [];
  }
  /**
   * Subscribes an object observer to receive notifications via its `update()` method.
   *
   * **Immutable Pattern:** Creates a new array using spread operator instead of
   * mutating the existing observers array.
   *
   * @param {ObserverObject | null | undefined} observer - Observer object (may have `update` method)
   * @returns {void}
   *
   * @example
   * const observer = { update: (source, event) => console.log(event) };
   * subject.subscribe(observer);
   */
  subscribe(r) {
    r && (this._observers = [...this._observers, r]);
  }
  /**
   * Unsubscribes an object observer from notifications.
   *
   * **Immutable Pattern:** Uses filter to create a new array without the observer.
   *
   * @param {ObserverObject} observer - Observer object to remove
   * @returns {void}
   *
   * @example
   * subject.unsubscribe(myObserver);
   */
  unsubscribe(r) {
    this._observers = this._observers.filter((e) => e !== r);
  }
  /**
   * Notifies all subscribed object observers.
   * Calls `observer.update(...args)` on each observer that implements `update`.
   * Errors thrown by individual observers are caught so others still receive notifications.
   *
   * @param {...unknown} args - Arguments forwarded to each observer's `update()` method
   * @returns {void}
   *
   * @example
   * subject.notifyObservers(this, 'positionChanged', position, null);
   */
  notifyObservers(...r) {
    this._observers.forEach((e) => {
      if (typeof e.update == "function")
        try {
          e.update(...r);
        } catch (s) {
          console.warn("DualObserverSubject: Error notifying observer", s);
        }
    });
  }
  /**
   * Subscribes a function observer to receive notifications via `notifyFunctionObservers`.
   *
   * **Immutable Pattern:** Creates a new array using spread operator.
   *
   * @param {ObserverFunction | null | undefined} observerFunction - Callback function
   * @returns {void}
   *
   * @example
   * const handler = (source, event, data) => console.log(event);
   * subject.subscribeFunction(handler);
   */
  subscribeFunction(r) {
    r && (this._functionObservers = [...this._functionObservers, r]);
  }
  /**
   * Unsubscribes a function observer from notifications.
   *
   * **Immutable Pattern:** Uses filter to create a new array without the function.
   *
   * @param {ObserverFunction} observerFunction - Function to remove
   * @returns {void}
   *
   * @example
   * subject.unsubscribeFunction(handler);
   */
  unsubscribeFunction(r) {
    this._functionObservers = this._functionObservers.filter((e) => e !== r);
  }
  /**
   * Notifies all subscribed function observers.
   * Errors thrown by individual observers are caught so others still receive notifications.
   *
   * @param {...unknown} args - Arguments forwarded to each observer function
   * @returns {void}
   *
   * @example
   * subject.notifyFunctionObservers(this, 'positionChanged', data);
   */
  notifyFunctionObservers(...r) {
    this._functionObservers.forEach((e) => {
      if (typeof e == "function")
        try {
          e(...r);
        } catch (s) {
          console.warn("DualObserverSubject: Error notifying function observer", s);
        }
    });
  }
  /**
   * Returns the count of subscribed object observers.
   *
   * @returns {number} Number of object observers subscribed via {@link subscribe}
   */
  getObserverCount() {
    return this._observers.length;
  }
  /**
   * Returns the count of subscribed function observers.
   *
   * @returns {number} Number of function observers subscribed via {@link subscribeFunction}
   */
  getFunctionObserverCount() {
    return this._functionObservers.length;
  }
  /**
   * Removes all observers (both object and function collections).
   *
   * @returns {void}
   *
   * @example
   * subject.clearAllObservers();
   * console.log(subject.getObserverCount());         // 0
   * console.log(subject.getFunctionObserverCount()); // 0
   */
  clearAllObservers() {
    this._observers = [], this._functionObservers = [];
  }
};

// src/utils/DefaultEventNotifier.ts
var DefaultEventNotifier = class {
  _subject;
  /**
   * Creates a new DefaultEventNotifier instance
   *
   * @example
   * const notifier = new DefaultEventNotifier();
   */
  constructor() {
    this._subject = new i();
  }
  /**
   * Read-only view of the currently subscribed observers.
   *
   * @type {ReadonlyArray<Observer>}
   */
  get observers() {
    return this._subject.observers;
  }
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
  subscribe(observer) {
    this._subject.subscribe(observer);
  }
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
  unsubscribe(observer) {
    this._subject.unsubscribe(observer);
  }
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
  notify(...args) {
    this._subject.notifyObservers(...args);
  }
  /**
   * Clears all subscribed observers
   *
   * @example
   * notifier.clear();
   * console.log('Subscribers:', notifier.subscriberCount); // 0
   */
  clear() {
    this._subject.clearAllObservers();
  }
  /**
   * Gets the current number of subscribed observers
   *
   * @returns {number} The number of observers
   *
   * @example
   * console.log(`Active observers: ${notifier.subscriberCount}`);
   */
  get subscriberCount() {
    return this._subject.getObserverCount();
  }
};

// src/core/IbiraAPIFetcher.ts
var IbiraAPIFetcher = class _IbiraAPIFetcher {
  url;
  timeout;
  cache;
  eventNotifier;
  maxRetries;
  retryDelay;
  retryMultiplier;
  retryableStatusCodes;
  validateStatus;
  method;
  body;
  headers;
  onRequest;
  onResponse;
  retryStrategy;
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
  static withExternalCache(url, cache, options = {}) {
    return new _IbiraAPIFetcher(url, cache, options);
  }
  /**
   * Creates a default cache with expiration and size limits
   * 
   * @private
   * @static
   * @param {FetcherOptions} [options={}] - Cache configuration options
   * @returns {CacheInterface} Configured cache instance
   */
  static _createDefaultCache(options = {}) {
    const cache = /* @__PURE__ */ new Map();
    cache.maxSize = options.maxCacheSize || 100;
    cache.expiration = options.cacheExpiration || 5 * 60 * 1e3;
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
    return new _IbiraAPIFetcher(url, cache, options);
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
  static withoutCache(url, options = {}) {
    const noCache = {
      has: () => false,
      get: () => null,
      set: () => {
      },
      delete: () => false,
      clear: () => {
      },
      size: 0,
      entries: () => [],
      maxSize: 0,
      expiration: 0
    };
    return new _IbiraAPIFetcher(url, noCache, options);
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
  static withEventCallback(url, eventCallback, options = {}) {
    const callbackNotifier = {
      subscribe: () => {
      },
      // No-op for external callback
      unsubscribe: () => {
      },
      // No-op for external callback
      notify: eventCallback,
      clear: () => {
      },
      subscriberCount: 1
    };
    const cache = options.cache || this._createDefaultCache(options);
    return new _IbiraAPIFetcher(url, cache, { ...options, eventNotifier: callbackNotifier });
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
  static withoutEvents(url, options = {}) {
    const noEvents = {
      subscribe: () => {
      },
      unsubscribe: () => {
      },
      notify: () => {
      },
      // Silent - no event notifications
      clear: () => {
      },
      subscriberCount: 0
    };
    const cache = options.cache || this._createDefaultCache(options);
    return new _IbiraAPIFetcher(url, cache, { ...options, eventNotifier: noEvents });
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
  static pure(url, options = {}) {
    const noCache = {
      has: () => false,
      get: () => null,
      set: () => {
      },
      delete: () => false,
      clear: () => {
      },
      size: 0,
      entries: () => [],
      maxSize: options.maxCacheSize || 100,
      expiration: options.cacheExpiration || 5 * 60 * 1e3
    };
    const noEvents = {
      subscribe: () => {
      },
      unsubscribe: () => {
      },
      notify: () => {
      },
      clear: () => {
      },
      subscriberCount: 0
    };
    return new _IbiraAPIFetcher(url, noCache, { ...options, eventNotifier: noEvents });
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
   * @param {Function} [options.onRequest] - Request interceptor called before each fetch attempt; return modified RequestInit
   * @param {Function} [options.onResponse] - Response interceptor called after each fetch attempt; return modified Response
   * @param {Function} [options.retryStrategy] - Custom retry predicate; return true to retry, false to stop
   */
  constructor(url, cache, options = {}) {
    this.url = url;
    this.timeout = options.timeout || 1e4;
    this.cache = cache;
    this.eventNotifier = options.eventNotifier || new DefaultEventNotifier();
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1e3;
    this.retryMultiplier = options.retryMultiplier ?? 2;
    this.retryableStatusCodes = Object.freeze([...options.retryableStatusCodes || [408, 429, 500, 502, 503, 504]]);
    this.validateStatus = options.validateStatus || ((status) => status >= 200 && status < 300);
    this.method = (options.method || "GET").toUpperCase();
    this.body = options.body !== void 0 ? options.body : null;
    this.headers = Object.freeze({ ...options.headers || {} });
    this.onRequest = options.onRequest ?? null;
    this.onResponse = options.onResponse ?? null;
    this.retryStrategy = options.retryStrategy ?? null;
    Object.freeze(this);
  }
  /**
   * Generates a unique cache key for this fetcher.
   * Includes the HTTP method so POST /url and GET /url cache independently.
   * 
   * @returns {string} The cache key (`METHOD:url`)
   */
  getCacheKey() {
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
  _createCacheEntry(data, currentTime, cache) {
    const expiration = cache.expiration || 3e5;
    return {
      data,
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
    return cacheEntry !== null && cacheEntry !== void 0 && currentTime < cacheEntry.expiresAt;
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
    const maxSize = activeCache.maxSize || 50;
    if (activeCache.size <= maxSize) {
      return;
    }
    const entries = Array.from(activeCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const entriesToRemove = activeCache.size - maxSize;
    for (let i2 = 0; i2 < entriesToRemove; i2++) {
      activeCache.delete(entries[i2][0]);
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
    expiredKeys.forEach((key) => activeCache.delete(key));
  }
  /**
   * Determines if an error is retryable based on error type and status code
   * 
   * @private
   * @param {Error} error - The error to check
   * @returns {boolean} True if the error is retryable
   */
  _isRetryableError(error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return true;
    }
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return true;
    }
    if (error.message.includes("HTTP error! status:")) {
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
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.max(100, delay + jitter);
  }
  /**
   * Sleeps for the specified number of milliseconds
   * 
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>} Promise that resolves after the delay
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Performs a single network request with timeout handling
   * 
   * @private
   * @param {AbortController} abortController - Controller for request cancellation
   * @param {AbortSignal} [externalSignal] - Optional external signal for consumer-level cancellation
   * @returns {Promise<any>} Promise that resolves to the fetched data
   */
  async _performSingleRequest(abortController, externalSignal = null) {
    const signal = abortController.signal;
    if (externalSignal) {
      if (externalSignal.aborted) {
        abortController.abort();
      } else {
        externalSignal.addEventListener("abort", () => abortController.abort(), { once: true });
      }
    }
    const fetchOptions = {
      method: this.method,
      signal
    };
    const mergedHeaders = { ...this.headers };
    const body = this.body;
    if (body !== null) {
      if (typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
        fetchOptions.body = JSON.stringify(body);
        if (!mergedHeaders["Content-Type"] && !mergedHeaders["content-type"]) {
          mergedHeaders["Content-Type"] = "application/json";
        }
      } else {
        fetchOptions.body = body;
      }
    }
    if (Object.keys(mergedHeaders).length > 0) {
      fetchOptions.headers = mergedHeaders;
    }
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.timeout);
    try {
      const effectiveFetchOptions = this.onRequest ? await this.onRequest({ ...fetchOptions }) : fetchOptions;
      const response = await fetch(this.url, effectiveFetchOptions);
      clearTimeout(timeoutId);
      const processedResponse = this.onResponse ? await this.onResponse(response) : response;
      if (!this.validateStatus(processedResponse.status)) {
        throw new Error(`HTTP error! status: ${processedResponse.status}`);
      }
      const data = await processedResponse.json();
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
    this.eventNotifier.subscribe(observer);
  }
  /**
   * Unsubscribes an observer from event notifications
   * 
   * @param {Observer} observer - Observer object to remove
   */
  unsubscribe(observer) {
    this.eventNotifier.unsubscribe(observer);
  }
  /**
   * Notifies all subscribed observers with event data
   * 
   * @param {...*} args - Arguments to pass to observers (typically eventType and payload)
   */
  notifyObservers(...args) {
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
  async fetchDataPure(currentCacheState, currentTime = Date.now(), networkProvider = null, signal = null) {
    const cacheKey = this.getCacheKey();
    const expiredKeys = this._getExpiredCacheKeys(currentCacheState, currentTime);
    const cleanedCache = /* @__PURE__ */ new Map();
    for (const [key, value] of currentCacheState.entries()) {
      if (!expiredKeys.includes(key)) {
        cleanedCache.set(key, value);
      }
    }
    if (cleanedCache.has(cacheKey)) {
      const cacheEntry = cleanedCache.get(cacheKey);
      if (this._isCacheEntryValid(cacheEntry, currentTime)) {
        const updatedEntry = { ...cacheEntry, timestamp: currentTime };
        const newCacheState = new Map(cleanedCache);
        newCacheState.set(cacheKey, updatedEntry);
        return Object.freeze({
          success: true,
          data: cacheEntry.data,
          fromCache: true,
          cacheOperations: Object.freeze([
            Object.freeze({ type: "update", key: cacheKey, value: updatedEntry })
          ]),
          events: Object.freeze([]),
          newCacheState,
          meta: Object.freeze({
            cacheKey,
            timestamp: currentTime,
            expiredKeysRemoved: expiredKeys.length
          })
        });
      }
    }
    const events = [
      { type: "loading-start", payload: Object.freeze({ url: this.url, cacheKey }) }
    ];
    try {
      const networkFn = networkProvider || (() => this._performSingleRequest(new AbortController(), signal));
      const data = await networkFn();
      const cacheEntry = this._createCacheEntry(data, currentTime, this.cache);
      const newCacheState = new Map(cleanedCache);
      newCacheState.set(cacheKey, cacheEntry);
      const finalCacheState = this._applyCacheSizeLimitsPure(newCacheState);
      return Object.freeze({
        success: true,
        data,
        fromCache: false,
        cacheOperations: Object.freeze([
          Object.freeze({ type: "set", key: cacheKey, value: cacheEntry }),
          ...this._calculateCacheEvictions(newCacheState, finalCacheState).map((op) => Object.freeze(op))
        ]),
        events: Object.freeze([
          ...events,
          { type: "success", payload: data }
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
          ...events,
          { type: "error", payload: Object.freeze({ error }) }
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
    const entries = Array.from(cacheState.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const entriesToKeep = entries.slice(-maxSize);
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
        evictions.push({ type: "delete", key });
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
  async fetchData(cacheOverride = null, signal = null) {
    const activeCache = cacheOverride || this.cache;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const result = await this.fetchDataPure(activeCache, Date.now(), null, signal);
      this._applySideEffects(result, activeCache);
      if (result.success) {
        return result.data;
      }
      const isLastAttempt = attempt >= this.maxRetries;
      const isExternallyAborted = signal?.aborted ?? false;
      const shouldRetry = this.retryStrategy ? this.retryStrategy(attempt, result.error) : this._isRetryableError(result.error);
      if (isLastAttempt || !shouldRetry || isExternallyAborted) {
        throw result.error;
      }
      await this._sleep(this._calculateRetryDelay(attempt));
    }
    throw new Error("Unexpected retry loop exit");
  }
  /**
   * Applies side effects based on pure computation results
   * 
   * @private
   * @param {FetchResult} result - Result from fetchDataPure
   * @param {Object} activeCache - Cache to apply operations to
   */
  _applySideEffects(result, activeCache) {
    result.cacheOperations.forEach((operation) => {
      switch (operation.type) {
        case "set":
        case "update":
          activeCache.set(operation.key, operation.value);
          break;
        case "delete":
          activeCache.delete(operation.key);
          break;
      }
    });
    result.events.forEach((event) => {
      this.notifyObservers(event.type, event.payload);
    });
  }
};

// src/core/IbiraAPIFetchManager.ts
var IbiraAPIFetchManager = class {
  fetchers;
  pendingRequests;
  globalCache;
  maxCacheSize;
  cacheExpiration;
  cleanupInterval;
  lastCleanup;
  defaultMaxRetries;
  defaultRetryDelay;
  defaultRetryMultiplier;
  defaultRetryableStatusCodes;
  cleanupTimer;
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
    this.fetchers = /* @__PURE__ */ new Map();
    this.pendingRequests = /* @__PURE__ */ new Map();
    this.globalCache = /* @__PURE__ */ new Map();
    this.maxCacheSize = options.maxCacheSize || 100;
    this.cacheExpiration = options.cacheExpiration || 3e5;
    this.cleanupInterval = options.cleanupInterval || 6e4;
    this.lastCleanup = Date.now();
    this.defaultMaxRetries = options.maxRetries || 3;
    this.defaultRetryDelay = options.retryDelay || 1e3;
    this.defaultRetryMultiplier = options.retryMultiplier || 2;
    this.defaultRetryableStatusCodes = options.retryableStatusCodes || [408, 429, 500, 502, 503, 504];
    this.cleanupTimer = null;
    this._startPeriodicCleanup();
  }
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
  getFetcher(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const fetcherKey = `${method}:${url}`;
    if (!this.fetchers.has(fetcherKey)) {
      this.globalCache.maxSize = this.maxCacheSize;
      this.globalCache.expiration = this.cacheExpiration;
      const fetcherOptions = {
        timeout: options.timeout,
        maxRetries: options.maxRetries !== void 0 ? options.maxRetries : this.defaultMaxRetries,
        retryDelay: options.retryDelay !== void 0 ? options.retryDelay : this.defaultRetryDelay,
        retryMultiplier: options.retryMultiplier !== void 0 ? options.retryMultiplier : this.defaultRetryMultiplier,
        retryableStatusCodes: options.retryableStatusCodes || this.defaultRetryableStatusCodes,
        method,
        body: options.body !== void 0 ? options.body : null,
        headers: options.headers || {}
      };
      const fetcher = new IbiraAPIFetcher(url, this.globalCache, fetcherOptions);
      this.fetchers.set(fetcherKey, fetcher);
    }
    return this.fetchers.get(fetcherKey);
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
    expiredKeys.forEach((key) => this.globalCache.delete(key));
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
    const entries = Array.from(this.globalCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const entriesToRemove = this.globalCache.size - this.maxCacheSize;
    for (let i2 = 0; i2 < entriesToRemove; i2++) {
      this.globalCache.delete(entries[i2][0]);
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
      data,
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
    return cacheEntry !== null && cacheEntry !== void 0 && currentTime < cacheEntry.expiresAt;
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
  async fetch(url, options = {}) {
    const fetcher = this.getFetcher(url, options);
    const cacheKey = fetcher.getCacheKey();
    if (this.pendingRequests.has(cacheKey)) {
      return await this.pendingRequests.get(cacheKey);
    }
    const requestPromise = this._executeFetch(fetcher);
    this.pendingRequests.set(cacheKey, requestPromise);
    try {
      const result = await requestPromise;
      return result;
    } finally {
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
    const promises = urls.map((url) => this.fetch(url, options));
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
    const fetcherKey = `GET:${url}`;
    if (this.fetchers.has(fetcherKey)) {
      this.fetchers.get(fetcherKey).unsubscribe(observer);
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
      this.globalCache.set(cacheKey, { ...cacheEntry, timestamp: now });
      return cacheEntry.data;
    }
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
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.pendingRequests.clear();
    this.fetchers.clear();
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
      cacheUtilization: Math.round(this.globalCache.size / this.maxCacheSize * 100),
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
    if (retryConfig.maxRetries !== void 0) {
      this.defaultMaxRetries = retryConfig.maxRetries;
    }
    if (retryConfig.retryDelay !== void 0) {
      this.defaultRetryDelay = retryConfig.retryDelay;
    }
    if (retryConfig.retryMultiplier !== void 0) {
      this.defaultRetryMultiplier = retryConfig.retryMultiplier;
    }
    if (retryConfig.retryableStatusCodes) {
      this.defaultRetryableStatusCodes = retryConfig.retryableStatusCodes;
    }
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
    const method = (retryConfig.method || "GET").toUpperCase();
    const fetcherKey = `${method}:${url}`;
    if (this.fetchers.has(fetcherKey)) {
      const oldFetcher = this.fetchers.get(fetcherKey);
      const newOptions = {
        timeout: oldFetcher.timeout,
        maxRetries: retryConfig.maxRetries !== void 0 ? retryConfig.maxRetries : oldFetcher.maxRetries,
        retryDelay: retryConfig.retryDelay !== void 0 ? retryConfig.retryDelay : oldFetcher.retryDelay,
        retryMultiplier: retryConfig.retryMultiplier !== void 0 ? retryConfig.retryMultiplier : oldFetcher.retryMultiplier,
        retryableStatusCodes: retryConfig.retryableStatusCodes || [...oldFetcher.retryableStatusCodes],
        eventNotifier: oldFetcher.eventNotifier,
        method: oldFetcher.method,
        body: oldFetcher.body,
        headers: { ...oldFetcher.headers }
      };
      const newFetcher = new IbiraAPIFetcher(url, oldFetcher.cache, newOptions);
      this.fetchers.set(fetcherKey, newFetcher);
    } else {
      this.getFetcher(url, retryConfig);
    }
  }
};

// src/utils/DefaultCache.ts
var DefaultCache = class {
  storage;
  maxSize;
  expiration;
  /**
   * Creates a new DefaultCache instance
   * 
   * @param {CacheOptions} [options={}] - Cache configuration options
   * 
   * @example
   * const cache = new DefaultCache({ maxSize: 200, expiration: 600000 });
   */
  constructor(options = {}) {
    this.storage = /* @__PURE__ */ new Map();
    this.maxSize = options.maxSize || 50;
    this.expiration = options.expiration || 3e5;
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
   * @returns {CacheEntry | undefined} The cached value or undefined if not found
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
   * @param {CacheEntry} value - The value to cache
   * 
   * @example
   * cache.set('user:123', { data: { name: 'John' }, timestamp: Date.now(), expiresAt: Date.now() + 300000 });
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
   * @returns {IterableIterator<[string, CacheEntry]>} Iterator over [key, value] pairs
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
    for (let i2 = 0; i2 < entriesToRemove; i2++) {
      this.storage.delete(entries[i2][0]);
    }
  }
};

// src/utils/throttle.ts
function throttle(fn, wait) {
  if (typeof fn !== "function") {
    throw new TypeError("throttle: first argument must be a function");
  }
  if (typeof wait !== "number" || wait < 0 || !isFinite(wait)) {
    throw new TypeError("throttle: wait must be a non-negative finite number");
  }
  let lastCall = 0;
  const throttled = (...args) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      return fn(...args);
    }
    return void 0;
  };
  throttled.flush = () => {
    lastCall = 0;
  };
  return throttled;
}

// src/utils/debounce.ts
function debounce(fn, wait) {
  if (typeof fn !== "function") {
    throw new TypeError("debounce: first argument must be a function");
  }
  if (typeof wait !== "number" || wait < 0 || !isFinite(wait)) {
    throw new TypeError("debounce: wait must be a non-negative finite number");
  }
  let timer = null;
  let latestArgs = null;
  let pending = [];
  const execute = async () => {
    timer = null;
    const args = latestArgs;
    latestArgs = null;
    const callbacks = pending.splice(0);
    try {
      const result = await fn(...args);
      callbacks.forEach((cb) => cb.resolve(result));
    } catch (error) {
      callbacks.forEach((cb) => cb.reject(error));
    }
  };
  const debounced = (...args) => {
    latestArgs = args;
    if (timer !== null) {
      clearTimeout(timer);
    }
    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      timer = setTimeout(() => void execute(), wait);
    });
  };
  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    latestArgs = null;
    pending = [];
  };
  debounced.flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      void execute();
    }
  };
  return debounced;
}

// src/config/version.ts
var VERSION = {
  major: 0,
  minor: 4,
  patch: 19,
  prerelease: "alpha",
  // Indicates unstable development
  toString() {
    return this.prerelease ? `${this.major}.${this.minor}.${this.patch}-${this.prerelease}` : `${this.major}.${this.minor}.${this.patch}`;
  }
};
export {
  DefaultCache,
  DefaultEventNotifier,
  IbiraAPIFetchManager,
  IbiraAPIFetcher,
  VERSION,
  debounce,
  throttle
};
/**
 * @fileoverview Default event notification system with observer pattern
 * @module utils/DefaultEventNotifier
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */
/**
 * @fileoverview Core fetcher class with caching and observer pattern support
 * @module core/IbiraAPIFetcher
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */
/**
 * @fileoverview Manager for coordinating multiple concurrent API fetch operations
 * @module core/IbiraAPIFetchManager
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */
/**
 * @fileoverview Default cache implementation with expiration and size limits
 * @module utils/DefaultCache
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 */
/**
 * @fileoverview Throttle higher-order function — limits how often a function can be called
 * @module utils/throttle
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */
/**
 * @fileoverview Debounce higher-order function — delays execution until activity stops
 * @module utils/debounce
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 */
/**
 * @fileoverview Semantic versioning configuration for ibira.js
 * @module config/version
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 * @see {@link https://semver.org/|Semantic Versioning 2.0.0}
 */
/**
 * @fileoverview ibira.js - A JavaScript library for fetching and caching API data with observer pattern support
 * @module ibira.js
 * @version 0.4.20-alpha
 * @license MIT
 * @author Marcelo Pereira Barbosa
 * @copyright 2026 Marcelo Pereira Barbosa
 * @see {@link https://github.com/mpbarbosa/ibira.js|GitHub Repository}
 * 
 * @description
 * A powerful JavaScript library providing:
 * - Intelligent API data fetching and caching
 * - Observer pattern support for reactive updates
 * - JSON response handling
 * - Robust error management with retry logic
 * - Request deduplication and race condition protection
 * - Configurable cache with expiration and size limits
 * 
 * @example
 * // Basic usage with default cache
 * import { IbiraAPIFetcher } from 'ibira.js';
 * 
 * const fetcher = IbiraAPIFetcher.withDefaultCache('https://api.example.com/data');
 * const data = await fetcher.fetchData();
 * 
 * @example
 * // Advanced usage with manager
 * import { IbiraAPIFetchManager } from 'ibira.js';
 * 
 * const manager = new IbiraAPIFetchManager({ maxCacheSize: 200 });
 * const data = await manager.fetch('https://api.example.com/data');
 */
//# sourceMappingURL=index.mjs.map