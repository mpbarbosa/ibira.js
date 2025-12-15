// __tests__/IbiraAPIFetchManager.test.js
// Unit tests for IbiraAPIFetchManager class

import { IbiraAPIFetchManager } from '../src/core/IbiraAPIFetchManager.js';
import { IbiraAPIFetcher } from '../src/core/IbiraAPIFetcher.js';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods
console.error = jest.fn();
console.warn = jest.fn();

describe('IbiraAPIFetchManager', () => {
	let manager;

	beforeEach(() => {
		manager = new IbiraAPIFetchManager();
		global.fetch.mockClear();
		jest.clearAllTimers();
	});

	afterEach(() => {
		if (manager) {
			manager.destroy();
		}
	});

	describe('Constructor and Initialization', () => {
		it('should initialize with default options', () => {
			expect(manager.maxCacheSize).toBe(100);
			expect(manager.cacheExpiration).toBe(300000);
			expect(manager.cleanupInterval).toBe(60000);
			expect(manager.defaultMaxRetries).toBe(3);
			expect(manager.defaultRetryDelay).toBe(1000);
			expect(manager.defaultRetryMultiplier).toBe(2);
		});

		it('should initialize with custom options', () => {
			const customManager = new IbiraAPIFetchManager({
				maxCacheSize: 200,
				cacheExpiration: 600000,
				cleanupInterval: 30000,
				maxRetries: 5,
				retryDelay: 2000,
				retryMultiplier: 3
			});
			
			expect(customManager.maxCacheSize).toBe(200);
			expect(customManager.cacheExpiration).toBe(600000);
			expect(customManager.cleanupInterval).toBe(30000);
			expect(customManager.defaultMaxRetries).toBe(5);
			expect(customManager.defaultRetryDelay).toBe(2000);
			expect(customManager.defaultRetryMultiplier).toBe(3);
			
			customManager.destroy();
		});

		it('should initialize with empty collections', () => {
			expect(manager.fetchers.size).toBe(0);
			expect(manager.pendingRequests.size).toBe(0);
			expect(manager.globalCache.size).toBe(0);
		});

		it('should start periodic cleanup timer', () => {
			expect(manager.cleanupTimer).toBeDefined();
		});
	});

	describe('getFetcher Method', () => {
		it('should create new fetcher for new URL', () => {
			const url = 'https://api.example.com/data';
			const fetcher = manager.getFetcher(url);
			
			expect(fetcher).toBeInstanceOf(IbiraAPIFetcher);
			expect(manager.fetchers.size).toBe(1);
			expect(manager.fetchers.has(url)).toBe(true);
		});

		it('should reuse existing fetcher for same URL', () => {
			const url = 'https://api.example.com/data';
			const fetcher1 = manager.getFetcher(url);
			const fetcher2 = manager.getFetcher(url);
			
			expect(fetcher1).toBe(fetcher2);
			expect(manager.fetchers.size).toBe(1);
		});

		it('should create different fetchers for different URLs', () => {
			const url1 = 'https://api.example.com/data1';
			const url2 = 'https://api.example.com/data2';
			
			const fetcher1 = manager.getFetcher(url1);
			const fetcher2 = manager.getFetcher(url2);
			
			expect(fetcher1).not.toBe(fetcher2);
			expect(manager.fetchers.size).toBe(2);
		});

		it('should pass custom options to fetcher', () => {
			const url = 'https://api.example.com/data';
			const options = {
				timeout: 5000,
				maxRetries: 5
			};
			
			const fetcher = manager.getFetcher(url, options);
			
			expect(fetcher.timeout).toBe(5000);
			expect(fetcher.maxRetries).toBe(5);
		});
	});

	describe('fetch Method', () => {
		it('should fetch data successfully', async () => {
			const url = 'https://api.example.com/data';
			const mockData = { result: 'success' };
			
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData
			});
			
			const data = await manager.fetch(url);
			
			expect(data).toEqual(mockData);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('should deduplicate concurrent requests', async () => {
			const url = 'https://api.example.com/data';
			const mockData = { result: 'success' };
			
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData
			});
			
			const promise1 = manager.fetch(url);
			const promise2 = manager.fetch(url);
			const promise3 = manager.fetch(url);
			
			const [data1, data2, data3] = await Promise.all([promise1, promise2, promise3]);
			
			expect(data1).toEqual(mockData);
			expect(data2).toEqual(mockData);
			expect(data3).toEqual(mockData);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('should clean up pending requests after completion', async () => {
			const url = 'https://api.example.com/data';
			
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ result: 'success' })
			});
			
			await manager.fetch(url);
			
			expect(manager.pendingRequests.size).toBe(0);
		});

		it('should clean up pending requests after error', async () => {
			const url = 'https://api.example.com/data';
			
			global.fetch.mockRejectedValueOnce(new Error('Network error'));
			
			await expect(manager.fetch(url)).rejects.toThrow('Network error');
			
			expect(manager.pendingRequests.size).toBe(0);
		});
	});

	describe('fetchMultiple Method', () => {
		it('should fetch multiple URLs concurrently', async () => {
			const urls = [
				'https://api.example.com/data1',
				'https://api.example.com/data2',
				'https://api.example.com/data3'
			];
			
			global.fetch.mockImplementation((url) => {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({ url })
				});
			});
			
			const results = await manager.fetchMultiple(urls);
			
			expect(results).toHaveLength(3);
			expect(results[0].status).toBe('fulfilled');
			expect(results[1].status).toBe('fulfilled');
			expect(results[2].status).toBe('fulfilled');
		});

		it('should handle mixed success and failure', async () => {
			const urls = [
				'https://api.example.com/success',
				'https://api.example.com/failure'
			];
			
			global.fetch.mockImplementation((url) => {
				if (url.includes('failure')) {
					return Promise.reject(new Error('Failed'));
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({ url })
				});
			});
			
			const results = await manager.fetchMultiple(urls);
			
			expect(results).toHaveLength(2);
			expect(results[0].status).toBe('fulfilled');
			expect(results[1].status).toBe('rejected');
		});
	});

	describe('Cache Management', () => {
		it('should cache fetched data', async () => {
			const url = 'https://api.example.com/data';
			const mockData = { result: 'cached' };
			
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData
			});
			
			await manager.fetch(url);
			
			const cachedData = manager.getCachedData(url);
			expect(cachedData).toEqual(mockData);
		});

		it('should return null for non-existent cache', () => {
			const url = 'https://api.example.com/data';
			const cachedData = manager.getCachedData(url);
			expect(cachedData).toBeNull();
		});

		it('should clear specific URL cache', async () => {
			const url = 'https://api.example.com/data';
			
			global.fetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ result: 'test' })
			});
			
			await manager.fetch(url);
			expect(manager.getCachedData(url)).toBeDefined();
			
			manager.clearCache(url);
			expect(manager.getCachedData(url)).toBeNull();
		});

		it('should clear all cache', async () => {
			const url1 = 'https://api.example.com/data1';
			const url2 = 'https://api.example.com/data2';
			
			global.fetch.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ result: 'test' })
			});
			
			await manager.fetch(url1);
			await manager.fetch(url2);
			
			manager.clearCache();
			
			expect(manager.getCachedData(url1)).toBeNull();
			expect(manager.getCachedData(url2)).toBeNull();
		});
	});

	describe('Observer Pattern', () => {
		it('should subscribe to fetcher events', () => {
			const url = 'https://api.example.com/data';
			const observer = { update: jest.fn() };
			
			manager.subscribe(url, observer);
			const fetcher = manager.getFetcher(url);
			
			expect(fetcher.eventNotifier.subscriberCount).toBe(1);
		});

		it('should unsubscribe from fetcher events', () => {
			const url = 'https://api.example.com/data';
			const observer = { update: jest.fn() };
			
			manager.subscribe(url, observer);
			manager.unsubscribe(url, observer);
			
			const fetcher = manager.getFetcher(url);
			expect(fetcher.eventNotifier.subscriberCount).toBe(0);
		});

		it('should handle unsubscribe for non-existent fetcher', () => {
			const url = 'https://api.example.com/data';
			const observer = { update: jest.fn() };
			
			expect(() => manager.unsubscribe(url, observer)).not.toThrow();
		});
	});

	describe('isLoading Method', () => {
		it('should return false when no request is pending', () => {
			const url = 'https://api.example.com/data';
			expect(manager.isLoading(url)).toBe(false);
		});

		it('should return true when request is pending', async () => {
			const url = 'https://api.example.com/data';
			
			global.fetch.mockImplementation(() => 
				new Promise(resolve => setTimeout(() => resolve({
					ok: true,
					status: 200,
					json: async () => ({})
				}), 100))
			);
			
			const promise = manager.fetch(url);
			expect(manager.isLoading(url)).toBe(true);
			
			await promise;
			expect(manager.isLoading(url)).toBe(false);
		});
	});

	describe('Statistics and Configuration', () => {
		it('should return correct stats', () => {
			const stats = manager.getStats();
			
			expect(stats).toHaveProperty('activeFetchers');
			expect(stats).toHaveProperty('pendingRequests');
			expect(stats).toHaveProperty('cacheSize');
			expect(stats).toHaveProperty('maxCacheSize');
			expect(stats).toHaveProperty('cacheUtilization');
			expect(stats).toHaveProperty('lastCleanup');
		});

		it('should set cache expiration', () => {
			manager.setCacheExpiration(600000);
			expect(manager.cacheExpiration).toBe(600000);
		});

		it('should set max cache size', () => {
			manager.setMaxCacheSize(200);
			expect(manager.maxCacheSize).toBe(200);
		});

		it('should get retry config', () => {
			const config = manager.getRetryConfig();
			
			expect(config.maxRetries).toBe(3);
			expect(config.retryDelay).toBe(1000);
			expect(config.retryMultiplier).toBe(2);
			expect(config.retryableStatusCodes).toEqual([408, 429, 500, 502, 503, 504]);
		});

		it('should set retry config', () => {
			manager.setRetryConfig({
				maxRetries: 5,
				retryDelay: 2000
			});
			
			expect(manager.defaultMaxRetries).toBe(5);
			expect(manager.defaultRetryDelay).toBe(2000);
		});
	});

	describe('Cleanup and Destroy', () => {
		it('should trigger cleanup manually', () => {
			const spy = jest.spyOn(manager, '_performPeriodicCleanup');
			manager.triggerCleanup();
			expect(spy).toHaveBeenCalled();
		});

		it('should destroy manager and clean up resources', () => {
			const url = 'https://api.example.com/data';
			manager.getFetcher(url);
			
			expect(manager.fetchers.size).toBe(1);
			expect(manager.cleanupTimer).toBeDefined();
			
			manager.destroy();
			
			expect(manager.fetchers.size).toBe(0);
			expect(manager.pendingRequests.size).toBe(0);
			expect(manager.globalCache.size).toBe(0);
			expect(manager.cleanupTimer).toBeNull();
		});
	});

	describe('Helper Methods', () => {
		it('should create cache entry with correct structure', () => {
			const data = { test: 'data' };
			const currentTime = Date.now();
			const entry = manager._createCacheEntry(data, currentTime);
			
			expect(entry.data).toBe(data);
			expect(entry.timestamp).toBe(currentTime);
			expect(entry.expiresAt).toBe(currentTime + manager.cacheExpiration);
		});

		it('should validate cache entry correctly', () => {
			const currentTime = Date.now();
			const validEntry = { expiresAt: currentTime + 10000 };
			const expiredEntry = { expiresAt: currentTime - 1000 };
			
			expect(manager._isCacheEntryValid(validEntry, currentTime)).toBe(true);
			expect(manager._isCacheEntryValid(expiredEntry, currentTime)).toBe(false);
			expect(manager._isCacheEntryValid(null, currentTime)).toBeFalsy();
		});

		it('should identify expired cache keys', () => {
			const cache = new Map();
			const currentTime = Date.now();
			
			cache.set('valid', { expiresAt: currentTime + 10000 });
			cache.set('expired1', { expiresAt: currentTime - 1000 });
			cache.set('expired2', { expiresAt: currentTime - 5000 });
			
			const expiredKeys = manager._getExpiredCacheKeys(cache, currentTime);
			
			expect(expiredKeys).toHaveLength(2);
			expect(expiredKeys).toContain('expired1');
			expect(expiredKeys).toContain('expired2');
			expect(expiredKeys).not.toContain('valid');
		});
	});
});
