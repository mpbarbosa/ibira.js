// __tests__/exports.test.js
// Tests to verify proper exports and prevent circular export issues

import { IbiraAPIFetcher, IbiraAPIFetchManager } from '../src/ibira.js';

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
});
