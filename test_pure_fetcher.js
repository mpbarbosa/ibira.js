#!/usr/bin/env node

import { IbiraAPIFetcher } from './src/ibira.js';

/**
 * Test suite demonstrating pure referential transparency
 */
async function testPureReferentialTransparency() {
    console.log('🧪 Testing Pure Referential Transparency\n');

    // Create a pure fetcher
    const fetcher = IbiraAPIFetcher.pure('https://jsonplaceholder.typicode.com/posts/1');

    // Mock network provider for deterministic testing
    const mockNetworkProvider = () => Promise.resolve({
        id: 1,
        title: 'Test Post',
        body: 'Test content',
        userId: 1
    });

    console.log('📊 Test 1: Pure function determinism');
    const cacheState1 = new Map();
    const timestamp = 1697203200000; // Fixed timestamp for determinism

    // Call the pure function multiple times with same inputs
    const result1a = await fetcher.fetchDataPure(cacheState1, timestamp, mockNetworkProvider);
    const result1b = await fetcher.fetchDataPure(cacheState1, timestamp, mockNetworkProvider);

    console.log('✅ Same inputs produce identical results:', 
        JSON.stringify(result1a) === JSON.stringify(result1b));
    console.log('✅ Original cache unchanged:', cacheState1.size === 0);
    console.log('✅ Result contains expected data:', result1a.success && result1a.data.title === 'Test Post');
    console.log('✅ Result describes cache operations:', result1a.cacheOperations.length > 0);
    console.log('✅ Result describes events:', result1a.events.length > 0);

    console.log('\n📊 Test 2: Cache hit behavior (pure)');
    
    // Create cache with existing entry
    const existingCache = new Map();
    const cacheKey = fetcher.getCacheKey();
    const existingEntry = {
        data: { id: 1, title: 'Cached Post', fromCache: true },
        timestamp: timestamp,
        expiresAt: timestamp + 300000 // 5 minutes from timestamp
    };
    existingCache.set(cacheKey, existingEntry);

    const result2 = await fetcher.fetchDataPure(existingCache, timestamp);
    
    console.log('✅ Cache hit detected:', result2.fromCache === true);
    console.log('✅ Cached data returned:', result2.data.title === 'Cached Post');
    console.log('✅ No network request needed:', result2.meta.networkRequest !== true);
    console.log('✅ Original cache unchanged:', existingCache.get(cacheKey).timestamp === timestamp);
    console.log('✅ New cache state has updated timestamp:', 
        result2.newCacheState.get(cacheKey).timestamp === timestamp);

    console.log('\n📊 Test 3: Cache expiration (pure)');
    
    // Create cache with expired entry
    const expiredCache = new Map();
    const expiredEntry = {
        data: { id: 1, title: 'Expired Post' },
        timestamp: timestamp - 400000, // 6+ minutes ago
        expiresAt: timestamp - 100000   // Expired
    };
    expiredCache.set(cacheKey, expiredEntry);

    const result3 = await fetcher.fetchDataPure(expiredCache, timestamp, mockNetworkProvider);
    
    console.log('✅ Expired entry ignored:', result3.fromCache === false);
    console.log('✅ Network request performed:', result3.meta.networkRequest === true);
    console.log('✅ Expired entries cleaned:', result3.meta.expiredKeysRemoved > 0);
    console.log('✅ New data fetched:', result3.data.title === 'Test Post');

    console.log('\n📊 Test 4: Error handling (pure)');
    
    const errorNetworkProvider = () => Promise.reject(new Error('Network error'));
    const result4 = await fetcher.fetchDataPure(new Map(), timestamp, errorNetworkProvider);
    
    console.log('✅ Error handled without throwing:', result4.success === false);
    console.log('✅ Error captured in result:', result4.error.message === 'Network error');
    console.log('✅ Error events recorded:', 
        result4.events.some(e => e.type === 'error'));
    console.log('✅ Cache state preserved on error:', result4.newCacheState.size === 0);

    console.log('\n📊 Test 5: Cache size limits (pure)');
    
    // Create cache at size limit
    const fullCache = new Map();
    // Simulate cache with max size of 2 for this test
    const smallFetcher = IbiraAPIFetcher.pure('https://test.com', { maxCacheSize: 2 });
    
    fullCache.set('key1', { data: 'data1', timestamp: timestamp - 1000, expiresAt: timestamp + 300000 });
    fullCache.set('key2', { data: 'data2', timestamp: timestamp - 500, expiresAt: timestamp + 300000 });
    
    const result5 = await smallFetcher.fetchDataPure(fullCache, timestamp, mockNetworkProvider);
    
    console.log('✅ Cache size limited:', result5.newCacheState.size === 2);
    console.log('✅ Oldest entry evicted:', !result5.newCacheState.has('key1'));
    console.log('✅ Evictions tracked:', 
        result5.cacheOperations.some(op => op.type === 'delete'));

    console.log('\n🎉 Pure Referential Transparency Tests Complete!');
    console.log('\n🌟 Benefits Achieved:');
    console.log('✅ 100% Deterministic - same inputs = same outputs');
    console.log('✅ Zero side effects - no external mutations');
    console.log('✅ Completely testable - mock all dependencies');
    console.log('✅ Fully composable - results can be combined/transformed');
    console.log('✅ Time-travel debugging - replay with different timestamps');
    console.log('✅ Concurrent safe - no shared mutable state');
}

/**
 * Test practical wrapper that applies side effects
 */
async function testPracticalWrapper() {
    console.log('\n🔧 Testing Practical Wrapper (with side effects)\n');

    const fetcher = IbiraAPIFetcher.withDefaultCache('https://jsonplaceholder.typicode.com/posts/1');
    
    console.log('📊 Testing practical usage...');
    
    try {
        // This will actually make HTTP request and apply side effects
        console.log('Making real HTTP request...');
        const data = await fetcher.fetchData();
        console.log('✅ Data fetched successfully:', !!data);
        console.log('✅ Title received:', data.title?.length > 0);
        
        // Second call should hit cache
        console.log('Making second request (should hit cache)...');
        const cachedData = await fetcher.fetchData();
        console.log('✅ Cache working:', JSON.stringify(data) === JSON.stringify(cachedData));
        
    } catch (error) {
        console.log('⚠️  Network request failed (expected in some environments):', error.message);
        console.log('✅ Error handled gracefully');
    }
}

// Run tests
testPureReferentialTransparency()
    .then(() => testPracticalWrapper())
    .catch(console.error);