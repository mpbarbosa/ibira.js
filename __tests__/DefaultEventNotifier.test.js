// __tests__/DefaultEventNotifier.test.js
// Unit tests for DefaultEventNotifier class

import { DefaultEventNotifier } from '../src/utils/DefaultEventNotifier.js';

describe('DefaultEventNotifier', () => {
	let notifier;

	beforeEach(() => {
		notifier = new DefaultEventNotifier();
	});

	afterEach(() => {
		notifier.clear();
	});

	describe('Constructor and Initialization', () => {
		it('should initialize with empty observers array', () => {
			expect(notifier.subscriberCount).toBe(0);
			expect(notifier.observers).toEqual([]);
		});
	});

	describe('Subscribe Method', () => {
		it('should add observer to the list', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			expect(notifier.subscriberCount).toBe(1);
		});

		it('should add multiple observers', () => {
			const observer1 = { update: jest.fn() };
			const observer2 = { update: jest.fn() };
			notifier.subscribe(observer1);
			notifier.subscribe(observer2);
			expect(notifier.subscriberCount).toBe(2);
		});

		it('should handle null observer gracefully', () => {
			notifier.subscribe(null);
			expect(notifier.subscriberCount).toBe(0);
		});

		it('should handle undefined observer gracefully', () => {
			notifier.subscribe(undefined);
			expect(notifier.subscriberCount).toBe(0);
		});

		it('should allow same observer to be added multiple times', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			notifier.subscribe(observer);
			expect(notifier.subscriberCount).toBe(2);
		});

		it('should create new array reference when subscribing', () => {
			const observer = { update: jest.fn() };
			const oldObservers = notifier.observers;
			notifier.subscribe(observer);
			expect(notifier.observers).not.toBe(oldObservers);
		});
	});

	describe('Unsubscribe Method', () => {
		it('should remove observer from the list', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			expect(notifier.subscriberCount).toBe(1);
			notifier.unsubscribe(observer);
			expect(notifier.subscriberCount).toBe(0);
		});

		it('should handle unsubscribing non-existent observer', () => {
			const observer = { update: jest.fn() };
			notifier.unsubscribe(observer);
			expect(notifier.subscriberCount).toBe(0);
		});

		it('should only remove specified observer', () => {
			const observer1 = { update: jest.fn() };
			const observer2 = { update: jest.fn() };
			const observer3 = { update: jest.fn() };
			
			notifier.subscribe(observer1);
			notifier.subscribe(observer2);
			notifier.subscribe(observer3);
			
			notifier.unsubscribe(observer2);
			
			expect(notifier.subscriberCount).toBe(2);
			expect(notifier.observers).toContain(observer1);
			expect(notifier.observers).not.toContain(observer2);
			expect(notifier.observers).toContain(observer3);
		});

		it('should remove only first occurrence if subscribed multiple times', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			notifier.subscribe(observer);
			expect(notifier.subscriberCount).toBe(2);
			notifier.unsubscribe(observer);
			expect(notifier.subscriberCount).toBe(0);
		});
	});

	describe('Notify Method', () => {
		it('should call update method on all observers', () => {
			const observer1 = { update: jest.fn() };
			const observer2 = { update: jest.fn() };
			
			notifier.subscribe(observer1);
			notifier.subscribe(observer2);
			
			notifier.notify('test-event', { data: 'test' });
			
			expect(observer1.update).toHaveBeenCalledWith('test-event', { data: 'test' });
			expect(observer2.update).toHaveBeenCalledWith('test-event', { data: 'test' });
		});

		it('should pass multiple arguments to observers', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			
			notifier.notify('event1', 'arg2', 'arg3', { key: 'value' });
			
			expect(observer.update).toHaveBeenCalledWith('event1', 'arg2', 'arg3', { key: 'value' });
		});

		it('should handle observers without update method', () => {
			const invalidObserver = { notUpdate: jest.fn() };
			notifier.subscribe(invalidObserver);
			
			expect(() => notifier.notify('test')).not.toThrow();
			expect(invalidObserver.notUpdate).not.toHaveBeenCalled();
		});

		it('should skip null observers', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			notifier.observers = [...notifier.observers, null];
			
			expect(() => notifier.notify('test')).not.toThrow();
			expect(observer.update).toHaveBeenCalledWith('test');
		});

		it('should handle observer throwing error', () => {
			const goodObserver = { update: jest.fn() };
			const badObserver = { 
				update: jest.fn(() => { 
					throw new Error('Observer error'); 
				}) 
			};
			
			notifier.subscribe(goodObserver);
			notifier.subscribe(badObserver);
			
			expect(() => notifier.notify('test')).toThrow('Observer error');
			expect(goodObserver.update).toHaveBeenCalled();
		});

		it('should handle notify with no arguments', () => {
			const observer = { update: jest.fn() };
			notifier.subscribe(observer);
			
			notifier.notify();
			
			expect(observer.update).toHaveBeenCalledWith();
		});

		it('should not notify when no observers subscribed', () => {
			expect(() => notifier.notify('test')).not.toThrow();
		});
	});

	describe('Clear Method', () => {
		it('should remove all observers', () => {
			const observer1 = { update: jest.fn() };
			const observer2 = { update: jest.fn() };
			
			notifier.subscribe(observer1);
			notifier.subscribe(observer2);
			expect(notifier.subscriberCount).toBe(2);
			
			notifier.clear();
			expect(notifier.subscriberCount).toBe(0);
			expect(notifier.observers).toEqual([]);
		});

		it('should allow new subscriptions after clear', () => {
			const observer1 = { update: jest.fn() };
			const observer2 = { update: jest.fn() };
			
			notifier.subscribe(observer1);
			notifier.clear();
			notifier.subscribe(observer2);
			
			expect(notifier.subscriberCount).toBe(1);
			expect(notifier.observers).toContain(observer2);
		});
	});

	describe('SubscriberCount Property', () => {
		it('should return correct count', () => {
			expect(notifier.subscriberCount).toBe(0);
			
			notifier.subscribe({ update: jest.fn() });
			expect(notifier.subscriberCount).toBe(1);
			
			notifier.subscribe({ update: jest.fn() });
			expect(notifier.subscriberCount).toBe(2);
			
			notifier.clear();
			expect(notifier.subscriberCount).toBe(0);
		});
	});

	describe('Integration Scenarios', () => {
		it('should support typical observer pattern workflow', () => {
			const observer1 = { 
				name: 'observer1',
				update: jest.fn() 
			};
			const observer2 = { 
				name: 'observer2',
				update: jest.fn() 
			};
			
			notifier.subscribe(observer1);
			notifier.subscribe(observer2);
			
			notifier.notify('loading', { status: 'started' });
			expect(observer1.update).toHaveBeenCalledTimes(1);
			expect(observer2.update).toHaveBeenCalledTimes(1);
			
			notifier.unsubscribe(observer1);
			
			notifier.notify('loading', { status: 'finished' });
			expect(observer1.update).toHaveBeenCalledTimes(1);
			expect(observer2.update).toHaveBeenCalledTimes(2);
		});

		it('should maintain immutability pattern', () => {
			const observer = { update: jest.fn() };
			const oldObservers = notifier.observers;
			
			notifier.subscribe(observer);
			expect(notifier.observers).not.toBe(oldObservers);
			
			const currentObservers = notifier.observers;
			notifier.unsubscribe(observer);
			expect(notifier.observers).not.toBe(currentObservers);
		});
	});
});
