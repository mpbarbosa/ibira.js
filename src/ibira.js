// ibira.js
// A JavaScript library for fetching and caching API data with observer pattern support.
// Author: Marcelo Pereira Barbosa
// License: MIT

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