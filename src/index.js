/**
 * @fileoverview ibira.js - A JavaScript library for fetching and caching API data with observer pattern support
 * @module ibira.js
 * @version 0.2.1-alpha
 * @license MIT
 * @author Marcelo Pereira Barbosa
 * @copyright 2025 Marcelo Pereira Barbosa
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

export { IbiraAPIFetcher } from './core/IbiraAPIFetcher.js';
export { IbiraAPIFetchManager } from './core/IbiraAPIFetchManager.js';
export { DefaultCache } from './utils/DefaultCache.js';
export { DefaultEventNotifier } from './utils/DefaultEventNotifier.js';
export { VERSION } from './config/version.js';
