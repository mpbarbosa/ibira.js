// __tests__/exports.test.js
// Tests to verify proper exports and prevent circular export issues

import {
	IbiraAPIFetcher,
	IbiraAPIFetchManager,
	CircuitBreaker,
	CircuitBreakerManager,
	CircuitOpenError,
} from '../src/index.js';

describe('Module Exports', () => {
	test('should export IbiraAPIFetcher class', () => {
		expect(IbiraAPIFetcher).toBeDefined();
		expect(typeof IbiraAPIFetcher).toBe('function');
		expect(IbiraAPIFetcher.name).toBe('IbiraAPIFetcher');
	});

	test('should export IbiraAPIFetchManager class', () => {
		expect(IbiraAPIFetchManager).toBeDefined();
		expect(typeof IbiraAPIFetchManager).toBe('function');
		expect(IbiraAPIFetchManager.name).toBe('IbiraAPIFetchManager');
	});

	test('should allow creating instances of IbiraAPIFetcher', () => {
		const fetcher = new IbiraAPIFetcher({
			url: 'https://api.example.com/data',
		});
		expect(fetcher).toBeInstanceOf(IbiraAPIFetcher);
	});

	test('should allow creating instances of IbiraAPIFetchManager', () => {
		const manager = new IbiraAPIFetchManager();
		expect(manager).toBeInstanceOf(IbiraAPIFetchManager);
	});

	test('should export CircuitBreaker class', () => {
		expect(CircuitBreaker).toBeDefined();
		expect(typeof CircuitBreaker).toBe('function');
		expect(CircuitBreaker.name).toBe('CircuitBreaker');
	});

	test('should allow creating instances of CircuitBreaker', () => {
		const breaker = new CircuitBreaker('https://api.example.com');
		expect(breaker).toBeInstanceOf(CircuitBreaker);
		expect(breaker.getState()).toBe('closed');
	});

	test('should export CircuitBreakerManager class', () => {
		expect(CircuitBreakerManager).toBeDefined();
		expect(typeof CircuitBreakerManager).toBe('function');
		expect(CircuitBreakerManager.name).toBe('CircuitBreakerManager');
	});

	test('should allow creating instances of CircuitBreakerManager', () => {
		const inner = new IbiraAPIFetchManager({ cleanupStrategy: 'lazy' });
		const manager = new CircuitBreakerManager(inner);
		expect(manager).toBeInstanceOf(CircuitBreakerManager);
		inner.destroy();
	});

	test('should export CircuitOpenError class', () => {
		expect(CircuitOpenError).toBeDefined();
		expect(typeof CircuitOpenError).toBe('function');
		expect(CircuitOpenError.name).toBe('CircuitOpenError');
	});

	test('should allow creating instances of CircuitOpenError', () => {
		const err = new CircuitOpenError('https://api.example.com', Date.now() + 60_000);
		expect(err).toBeInstanceOf(CircuitOpenError);
		expect(err).toBeInstanceOf(Error);
	});
});
