#!/usr/bin/env node
/**
 * ibira.js performance benchmark
 *
 * Usage:
 *   npm run build          # ensure dist/ is current
 *   node scripts/benchmark.mjs
 *
 * Measures in-process throughput for DefaultCache, CircuitBreaker,
 * the fetchDataPure cache-hit path, and the throttle/debounce utilities.
 * Network latency is deliberately excluded — all fetch calls are mocked.
 */

import { performance } from 'node:perf_hooks';
import {
	DefaultCache,
	CircuitBreaker,
	IbiraAPIFetcher,
	throttle,
	debounce,
} from '../dist/index.mjs';

// ── helpers ──────────────────────────────────────────────────────────────────

const ITERATIONS = 100_000;
const WARM_UP    = 10_000;

function bench(label, fn, iterations = ITERATIONS) {
	// warm-up
	for (let i = 0; i < WARM_UP; i++) fn(i);

	const t0 = performance.now();
	for (let i = 0; i < iterations; i++) fn(i);
	const elapsed = performance.now() - t0;

	const opsPerSec = Math.round((iterations / elapsed) * 1000);
	const nsPerOp   = ((elapsed / iterations) * 1e6).toFixed(1);
	console.log(`  ${label.padEnd(48)} ${opsPerSec.toLocaleString().padStart(12)} ops/s   ${nsPerOp.padStart(8)} ns/op`);
	return { label, opsPerSec, nsPerOp: parseFloat(nsPerOp), elapsed };
}

async function benchAsync(label, fn, iterations = 10_000) {
	// warm-up
	for (let i = 0; i < 100; i++) await fn(i);

	const t0 = performance.now();
	for (let i = 0; i < iterations; i++) await fn(i);
	const elapsed = performance.now() - t0;

	const opsPerSec = Math.round((iterations / elapsed) * 1000);
	const usPerOp   = ((elapsed / iterations) * 1000).toFixed(2);
	console.log(`  ${label.padEnd(48)} ${opsPerSec.toLocaleString().padStart(12)} ops/s   ${usPerOp.padStart(8)} µs/op`);
	return { label, opsPerSec, usPerOp: parseFloat(usPerOp), elapsed };
}

// ── environment ───────────────────────────────────────────────────────────────

console.log('');
console.log('ibira.js Performance Benchmarks');
console.log('================================');
console.log(`Node.js  : ${process.version}`);
console.log(`Platform : ${process.platform} ${process.arch}`);
console.log(`Date     : ${new Date().toISOString()}`);
console.log('');

// ── 1. DefaultCache ───────────────────────────────────────────────────────────

console.log('## 1. DefaultCache');
console.log('');

const cache = new DefaultCache({ maxSize: 1000, expiration: 60_000 });
const fixedEntry = { data: { id: 1 }, timestamp: Date.now(), expiresAt: Date.now() + 60_000 };

bench('cache.set()  (sequential keys, no eviction)', (i) => {
	cache.set(`key-${i % 900}`, { ...fixedEntry });
});

bench('cache.get()  (warm hit, 900-entry cache)',    (i) => {
	cache.get(`key-${i % 900}`);
});

bench('cache.has()  (hit)',                          (i) => {
	cache.has(`key-${i % 900}`);
});

bench('cache.has()  (miss)',                         (i) => {
	cache.has(`miss-${i}`);
});

// LRU eviction: keep pushing entries beyond maxSize
const smallCache = new DefaultCache({ maxSize: 100, expiration: 60_000 });
bench('cache.set()  (LRU eviction active, maxSize=100)', (i) => {
	smallCache.set(`k-${i}`, { ...fixedEntry });
});

console.log('');

// ── 2. CircuitBreaker ────────────────────────────────────────────────────────

console.log('## 2. CircuitBreaker');
console.log('');

const closedBreaker = new CircuitBreaker('https://api.example.com', { failureThreshold: 5 });
bench('breaker.canAttempt()  (closed state)', () => {
	closedBreaker.canAttempt();
});

const openBreaker = new CircuitBreaker('https://api.example.com', {
	failureThreshold: 1,
	timeout: 60_000,
});
openBreaker.recordFailure(new Error('x'));
bench('breaker.canAttempt()  (open state, timeout not elapsed)', () => {
	openBreaker.canAttempt();
});

const cycleBreaker = new CircuitBreaker('https://api.example.com', { failureThreshold: 1 });
bench('recordFailure() + reset()  (open/close cycle)', (i) => {
	cycleBreaker.recordFailure(new Error('x'));
	cycleBreaker.reset();
});

console.log('');

// ── 3. fetchDataPure — cache-hit path ─────────────────────────────────────────

console.log('## 3. IbiraAPIFetcher.fetchDataPure — cache-hit path');
console.log('');

const pf = IbiraAPIFetcher.pure('https://api.example.com/data');
const cacheState = new Map();
cacheState.maxSize = 100;
cacheState.expiration = 60_000;
const now = Date.now();
cacheState.set('GET:https://api.example.com/data', {
	data:      { id: 1, name: 'cached' },
	timestamp: now,
	expiresAt: now + 60_000,
});

await benchAsync('fetchDataPure()  (cache hit, pure factory)', async () => {
	await pf.fetchDataPure(cacheState, Date.now());
});

console.log('');

// ── 4. throttle / debounce utility overhead ───────────────────────────────────

console.log('## 4. throttle / debounce');
console.log('');

const noop = () => {};
bench('throttle()   factory creation',  () => throttle(noop, 100));

const tFn = throttle(noop, 100);
bench('throttled fn  call (leading-edge hit, then skip)', (i) => {
	// every other call hits the throttle window — realistic mixed traffic
	tFn();
});

bench('debounce()   factory creation',  () => debounce(noop, 100));

const dFn = debounce(noop, 100);
bench('debounced fn  call (trailing accumulation)', () => {
	dFn();
});

console.log('');
console.log('Benchmarks complete.');
console.log('');
