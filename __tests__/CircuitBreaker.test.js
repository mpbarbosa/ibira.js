// @ts-check
'use strict';

import { CircuitBreaker } from '../src/resilience/CircuitBreaker.ts';

const URL = 'https://api.example.com/data';

describe('CircuitBreaker — initial state', () => {
	test('starts in closed state', () => {
		const breaker = new CircuitBreaker(URL);
		expect(breaker.getState()).toBe('closed');
	});

	test('canAttempt() returns true when closed', () => {
		const breaker = new CircuitBreaker(URL);
		expect(breaker.canAttempt()).toBe(true);
	});

	test('failureCount starts at 0', () => {
		const breaker = new CircuitBreaker(URL);
		expect(breaker.failureCount).toBe(0);
	});

	test('successCount starts at 0', () => {
		const breaker = new CircuitBreaker(URL);
		expect(breaker.successCount).toBe(0);
	});

	test('nextRetryTime starts at 0', () => {
		const breaker = new CircuitBreaker(URL);
		expect(breaker.nextRetryTime).toBe(0);
	});

	test('url getter returns the url passed to constructor', () => {
		const breaker = new CircuitBreaker(URL);
		expect(breaker.url).toBe(URL);
	});
});

describe('CircuitBreaker — closed state behaviour', () => {
	test('N-1 failures keep circuit closed', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 5 });
		for (let i = 0; i < 4; i++) {
			breaker.recordFailure(new Error('fail'));
		}
		expect(breaker.getState()).toBe('closed');
		expect(breaker.failureCount).toBe(4);
	});

	test('exactly N failures trip the circuit open', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 5 });
		for (let i = 0; i < 5; i++) {
			breaker.recordFailure(new Error('fail'));
		}
		expect(breaker.getState()).toBe('open');
	});

	test('success resets failureCount', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 5 });
		breaker.recordFailure(new Error('fail'));
		breaker.recordFailure(new Error('fail'));
		breaker.recordSuccess();
		expect(breaker.failureCount).toBe(0);
		expect(breaker.getState()).toBe('closed');
	});

	test('failure streak resets after a success', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 3 });
		breaker.recordFailure(new Error('fail'));
		breaker.recordFailure(new Error('fail'));
		breaker.recordSuccess();
		// One more failure should not open yet
		breaker.recordFailure(new Error('fail'));
		expect(breaker.getState()).toBe('closed');
		expect(breaker.failureCount).toBe(1);
	});

	test('uses default failureThreshold of 5', () => {
		const breaker = new CircuitBreaker(URL);
		for (let i = 0; i < 4; i++) breaker.recordFailure(new Error('x'));
		expect(breaker.getState()).toBe('closed');
		breaker.recordFailure(new Error('x'));
		expect(breaker.getState()).toBe('open');
	});
});

describe('CircuitBreaker — open state behaviour', () => {
	function makeOpenBreaker(threshold = 3) {
		const breaker = new CircuitBreaker(URL, { failureThreshold: threshold, timeout: 60_000 });
		for (let i = 0; i < threshold; i++) breaker.recordFailure(new Error('fail'));
		return breaker;
	}

	test('canAttempt() returns false when open and timeout not elapsed', () => {
		const breaker = makeOpenBreaker();
		expect(breaker.canAttempt()).toBe(false);
	});

	test('nextRetryTime is set when opened', () => {
		const before = Date.now();
		const breaker = makeOpenBreaker();
		expect(breaker.nextRetryTime).toBeGreaterThanOrEqual(before + 60_000 - 1);
	});

	test('canAttempt() returns true after timeout and transitions to half-open', () => {
		jest.useFakeTimers();
		const breaker = makeOpenBreaker(3);
		expect(breaker.getState()).toBe('open');

		jest.advanceTimersByTime(60_001);
		expect(breaker.canAttempt()).toBe(true);
		expect(breaker.getState()).toBe('half-open');
		jest.useRealTimers();
	});

	test('recordSuccess in open state is a no-op', () => {
		const breaker = makeOpenBreaker(3);
		breaker.recordSuccess();
		expect(breaker.getState()).toBe('open');
	});

	test('recordFailure in open state is a no-op', () => {
		const breaker = makeOpenBreaker(3);
		const prev = breaker.failureCount;
		breaker.recordFailure(new Error('another'));
		expect(breaker.getState()).toBe('open');
		expect(breaker.failureCount).toBe(prev);
	});
});

describe('CircuitBreaker — half-open state behaviour', () => {
	function makeHalfOpenBreaker(successThreshold = 2) {
		jest.useFakeTimers();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 3, successThreshold, timeout: 1000 });
		for (let i = 0; i < 3; i++) breaker.recordFailure(new Error('fail'));
		jest.advanceTimersByTime(1001);
		breaker.canAttempt(); // triggers transition to half-open
		return breaker;
	}

	afterEach(() => {
		jest.useRealTimers();
	});

	test('transitioned to half-open after timeout', () => {
		const breaker = makeHalfOpenBreaker();
		expect(breaker.getState()).toBe('half-open');
	});

	test('M-1 successes keep state half-open', () => {
		const breaker = makeHalfOpenBreaker(3);
		breaker.recordSuccess();
		breaker.recordSuccess();
		expect(breaker.getState()).toBe('half-open');
	});

	test('exactly M successes close the circuit', () => {
		const breaker = makeHalfOpenBreaker(2);
		breaker.recordSuccess();
		breaker.recordSuccess();
		expect(breaker.getState()).toBe('closed');
	});

	test('closing resets failureCount and successCount', () => {
		const breaker = makeHalfOpenBreaker(2);
		breaker.recordSuccess();
		breaker.recordSuccess();
		expect(breaker.failureCount).toBe(0);
		expect(breaker.successCount).toBe(0);
	});

	test('single failure in half-open reopens the circuit', () => {
		const breaker = makeHalfOpenBreaker(2);
		breaker.recordSuccess(); // one success (not enough to close)
		breaker.recordFailure(new Error('probe failed'));
		expect(breaker.getState()).toBe('open');
	});

	test('failure in half-open resets successCount', () => {
		const breaker = makeHalfOpenBreaker(2);
		breaker.recordSuccess();
		breaker.recordFailure(new Error('probe failed'));
		expect(breaker.successCount).toBe(0);
	});
});

describe('CircuitBreaker — state transition sequence closed → open → half-open → open', () => {
	test('failed probe returns to open and extends timeout', () => {
		jest.useFakeTimers();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, successThreshold: 2, timeout: 1000 });
		// Open the circuit
		breaker.recordFailure(new Error('a'));
		breaker.recordFailure(new Error('b'));
		expect(breaker.getState()).toBe('open');

		// Wait for timeout → half-open probe
		jest.advanceTimersByTime(1001);
		expect(breaker.canAttempt()).toBe(true);
		expect(breaker.getState()).toBe('half-open');

		// Probe fails → back to open
		breaker.recordFailure(new Error('probe'));
		expect(breaker.getState()).toBe('open');
		expect(breaker.canAttempt()).toBe(false);

		jest.useRealTimers();
	});
});

describe('CircuitBreaker — reset()', () => {
	test('reset closes an open circuit', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2 });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		breaker.reset();
		expect(breaker.getState()).toBe('closed');
	});

	test('reset clears all counters', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2 });
		breaker.recordFailure(new Error('x'));
		breaker.reset();
		expect(breaker.failureCount).toBe(0);
		expect(breaker.successCount).toBe(0);
		expect(breaker.nextRetryTime).toBe(0);
	});

	test('canAttempt() returns true after reset', () => {
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2 });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		breaker.reset();
		expect(breaker.canAttempt()).toBe(true);
	});
});

describe('CircuitBreaker — onStateChange callback', () => {
	test('fires when circuit opens', () => {
		const onChange = jest.fn();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, onStateChange: onChange });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith('closed', 'open', URL);
	});

	test('fires when circuit transitions to half-open', () => {
		jest.useFakeTimers();
		const onChange = jest.fn();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, timeout: 1000, onStateChange: onChange });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		onChange.mockClear();

		jest.advanceTimersByTime(1001);
		breaker.canAttempt();
		expect(onChange).toHaveBeenCalledWith('open', 'half-open', URL);
		jest.useRealTimers();
	});

	test('fires when circuit closes from half-open', () => {
		jest.useFakeTimers();
		const onChange = jest.fn();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, successThreshold: 1, timeout: 1000, onStateChange: onChange });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		jest.advanceTimersByTime(1001);
		breaker.canAttempt();
		onChange.mockClear();

		breaker.recordSuccess();
		expect(onChange).toHaveBeenCalledWith('half-open', 'closed', URL);
		jest.useRealTimers();
	});

	test('fires when probe fails (half-open → open)', () => {
		jest.useFakeTimers();
		const onChange = jest.fn();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, timeout: 1000, onStateChange: onChange });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		jest.advanceTimersByTime(1001);
		breaker.canAttempt();
		onChange.mockClear();

		breaker.recordFailure(new Error('probe'));
		expect(onChange).toHaveBeenCalledWith('half-open', 'open', URL);
		jest.useRealTimers();
	});

	test('does not fire on no-op transitions (open recordSuccess)', () => {
		const onChange = jest.fn();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, onStateChange: onChange });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		onChange.mockClear();
		breaker.recordSuccess(); // no-op in open state
		expect(onChange).not.toHaveBeenCalled();
	});

	test('reset() does not fire onStateChange', () => {
		const onChange = jest.fn();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, onStateChange: onChange });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		onChange.mockClear();
		breaker.reset();
		expect(onChange).not.toHaveBeenCalled();
	});
});

describe('CircuitBreaker — default configuration values', () => {
	test('default failureThreshold is 5', () => {
		const breaker = new CircuitBreaker(URL);
		for (let i = 0; i < 4; i++) breaker.recordFailure(new Error('x'));
		expect(breaker.getState()).toBe('closed');
		breaker.recordFailure(new Error('x'));
		expect(breaker.getState()).toBe('open');
	});

	test('default successThreshold is 2', () => {
		jest.useFakeTimers();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2, timeout: 1000 });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		jest.advanceTimersByTime(1001);
		breaker.canAttempt(); // → half-open
		breaker.recordSuccess();
		expect(breaker.getState()).toBe('half-open'); // still half-open after 1 success
		breaker.recordSuccess();
		expect(breaker.getState()).toBe('closed');    // closed after 2
		jest.useRealTimers();
	});

	test('default timeout is 60000ms', () => {
		jest.useFakeTimers();
		const breaker = new CircuitBreaker(URL, { failureThreshold: 2 });
		breaker.recordFailure(new Error('x'));
		breaker.recordFailure(new Error('x'));
		jest.advanceTimersByTime(59_999);
		expect(breaker.canAttempt()).toBe(false);
		jest.advanceTimersByTime(2);
		expect(breaker.canAttempt()).toBe(true);
		jest.useRealTimers();
	});
});
