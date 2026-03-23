// __tests__/index.test.js
// Unit tests for main entry point exports

import { 
	IbiraAPIFetcher, 
	IbiraAPIFetchManager, 
	DefaultCache, 
	DefaultEventNotifier, 
	VERSION 
} from '../src/index.js';
import { IbiraAPIFetcher as CoreFetcher } from '../src/core/IbiraAPIFetcher.js';
import { IbiraAPIFetchManager as CoreManager } from '../src/core/IbiraAPIFetchManager.js';
import { DefaultCache as UtilCache } from '../src/utils/DefaultCache.js';
import { DefaultEventNotifier as UtilNotifier } from '../src/utils/DefaultEventNotifier.js';
import { VERSION as ConfigVersion } from '../src/config/version.js';

describe('index.js exports', () => {
	it('should export IbiraAPIFetcher', () => {
		expect(IbiraAPIFetcher).toBeDefined();
		expect(IbiraAPIFetcher).toBe(CoreFetcher);
	});

	it('should export IbiraAPIFetchManager', () => {
		expect(IbiraAPIFetchManager).toBeDefined();
		expect(IbiraAPIFetchManager).toBe(CoreManager);
	});

	it('should export DefaultCache', () => {
		expect(DefaultCache).toBeDefined();
		expect(DefaultCache).toBe(UtilCache);
	});

	it('should export DefaultEventNotifier', () => {
		expect(DefaultEventNotifier).toBeDefined();
		expect(DefaultEventNotifier).toBe(UtilNotifier);
	});

	it('should export VERSION', () => {
		expect(VERSION).toBeDefined();
		expect(VERSION).toBe(ConfigVersion);
		expect(typeof VERSION).toBe('object');
		expect(VERSION.toString()).toMatch(/^\d+\.\d+\.\d+/);
	});

	it('should allow creating instances from exports', () => {
		const fetcher = new IbiraAPIFetcher('https://api.example.com');
		expect(fetcher).toBeInstanceOf(CoreFetcher);

		const manager = new IbiraAPIFetchManager();
		expect(manager).toBeInstanceOf(CoreManager);

		const cache = new DefaultCache();
		expect(cache).toBeInstanceOf(UtilCache);

		const notifier = new DefaultEventNotifier();
		expect(notifier).toBeInstanceOf(UtilNotifier);
		
		manager.destroy();
	});
});
