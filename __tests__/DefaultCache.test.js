// __tests__/DefaultCache.test.js
// Unit tests for DefaultCache class

import { DefaultCache } from '../src/utils/DefaultCache.js';

describe('DefaultCache', () => {
	let cache;

	beforeEach(() => {
		cache = new DefaultCache();
	});

	afterEach(() => {
		cache.clear();
	});

	describe('Constructor and Initialization', () => {
		it('should initialize with default options', () => {
			expect(cache.maxSize).toBe(50);
			expect(cache.expiration).toBe(300000);
			expect(cache.size).toBe(0);
		});

		it('should initialize with custom options', () => {
			const customCache = new DefaultCache({ maxSize: 100, expiration: 600000 });
			expect(customCache.maxSize).toBe(100);
			expect(customCache.expiration).toBe(600000);
		});

		it('should initialize with empty storage', () => {
			expect(cache.size).toBe(0);
		});
	});

	describe('Basic Operations', () => {
		it('should store and retrieve values', () => {
			const key = 'test-key';
			const value = { data: 'test-data', timestamp: Date.now() };
			cache.set(key, value);
			expect(cache.get(key)).toEqual(value);
		});

		it('should check if key exists', () => {
			const key = 'test-key';
			expect(cache.has(key)).toBe(false);
			cache.set(key, { data: 'test', timestamp: Date.now() });
			expect(cache.has(key)).toBe(true);
		});

		it('should delete entries', () => {
			const key = 'test-key';
			cache.set(key, { data: 'test', timestamp: Date.now() });
			expect(cache.has(key)).toBe(true);
			cache.delete(key);
			expect(cache.has(key)).toBe(false);
		});

		it('should clear all entries', () => {
			cache.set('key1', { data: 'test1', timestamp: Date.now() });
			cache.set('key2', { data: 'test2', timestamp: Date.now() });
			expect(cache.size).toBe(2);
			cache.clear();
			expect(cache.size).toBe(0);
		});

		it('should return correct size', () => {
			expect(cache.size).toBe(0);
			cache.set('key1', { data: 'test1', timestamp: Date.now() });
			expect(cache.size).toBe(1);
			cache.set('key2', { data: 'test2', timestamp: Date.now() });
			expect(cache.size).toBe(2);
		});

		it('should return entries iterator', () => {
			cache.set('key1', { data: 'test1', timestamp: Date.now() });
			cache.set('key2', { data: 'test2', timestamp: Date.now() });
			const entries = Array.from(cache.entries());
			expect(entries.length).toBe(2);
			expect(entries[0][0]).toBe('key1');
			expect(entries[1][0]).toBe('key2');
		});
	});

	describe('Size Limit Enforcement', () => {
		it('should enforce size limit using LRU eviction', () => {
			const smallCache = new DefaultCache({ maxSize: 3 });
			
			// Add entries with different timestamps
			smallCache.set('key1', { data: 'test1', timestamp: 100 });
			smallCache.set('key2', { data: 'test2', timestamp: 200 });
			smallCache.set('key3', { data: 'test3', timestamp: 300 });
			
			expect(smallCache.size).toBe(3);
			
			// Adding 4th item should evict the oldest (key1)
			smallCache.set('key4', { data: 'test4', timestamp: 400 });
			
			expect(smallCache.size).toBe(3);
			expect(smallCache.has('key1')).toBe(false);
			expect(smallCache.has('key2')).toBe(true);
			expect(smallCache.has('key3')).toBe(true);
			expect(smallCache.has('key4')).toBe(true);
		});

		it('should remove multiple entries when exceeding size limit', () => {
			const smallCache = new DefaultCache({ maxSize: 2 });
			
			smallCache.set('key1', { data: 'test1', timestamp: 100 });
			smallCache.set('key2', { data: 'test2', timestamp: 200 });
			smallCache.set('key3', { data: 'test3', timestamp: 300 });
			
			expect(smallCache.size).toBe(2);
			expect(smallCache.has('key1')).toBe(false);
			expect(smallCache.has('key2')).toBe(true);
			expect(smallCache.has('key3')).toBe(true);
		});

		it('should not evict entries when under size limit', () => {
			const smallCache = new DefaultCache({ maxSize: 5 });
			
			smallCache.set('key1', { data: 'test1', timestamp: 100 });
			smallCache.set('key2', { data: 'test2', timestamp: 200 });
			
			expect(smallCache.size).toBe(2);
			expect(smallCache.has('key1')).toBe(true);
			expect(smallCache.has('key2')).toBe(true);
		});
	});

	describe('Edge Cases', () => {
		it('should handle undefined values', () => {
			cache.set('key1', undefined);
			expect(cache.has('key1')).toBe(true);
			expect(cache.get('key1')).toBeUndefined();
		});

		it('should handle null values', () => {
			cache.set('key1', null);
			expect(cache.has('key1')).toBe(true);
			expect(cache.get('key1')).toBeNull();
		});

		it('should handle complex objects', () => {
			const complexValue = {
				data: { nested: { deep: 'value' } },
				timestamp: Date.now(),
				metadata: { count: 42 }
			};
			cache.set('key1', complexValue);
			expect(cache.get('key1')).toEqual(complexValue);
		});

		it('should overwrite existing keys', () => {
			cache.set('key1', { data: 'old', timestamp: 100 });
			cache.set('key1', { data: 'new', timestamp: 200 });
			expect(cache.get('key1')).toEqual({ data: 'new', timestamp: 200 });
			expect(cache.size).toBe(1);
		});

		it('should handle empty string as key', () => {
			cache.set('', { data: 'test', timestamp: Date.now() });
			expect(cache.has('')).toBe(true);
			expect(cache.get('')).toBeDefined();
		});
	});

	describe('Performance', () => {
		it('should handle large number of entries efficiently', () => {
			const largeCache = new DefaultCache({ maxSize: 1000 });
			
			for (let i = 0; i < 1000; i++) {
				largeCache.set(`key${i}`, { data: `value${i}`, timestamp: i });
			}
			
			expect(largeCache.size).toBe(1000);
		});

		it('should maintain size limit with continuous additions', () => {
			const limitedCache = new DefaultCache({ maxSize: 10 });
			
			for (let i = 0; i < 100; i++) {
				limitedCache.set(`key${i}`, { data: `value${i}`, timestamp: i });
			}
			
			expect(limitedCache.size).toBe(10);
		});
	});
});
