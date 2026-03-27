/**
 * @fileoverview Tests for VERSION semantic version object
 * @module __tests__/version.test
 */

import { VERSION } from '../src/config/version';

const pkg: { version: string } = require('../package.json');

const dashIdx = pkg.version.indexOf('-');
const versionCore = dashIdx === -1 ? pkg.version : pkg.version.slice(0, dashIdx);
const expectedPrerelease = dashIdx === -1 ? '' : pkg.version.slice(dashIdx + 1);
const [expectedMajor, expectedMinor, expectedPatch] = versionCore.split('.').map(Number);

/**
 * Creates a version-like object by merging VERSION with the given overrides.
 * Avoids repeating spread boilerplate across tests.
 */
function makeVersion(overrides: Partial<typeof VERSION>) {
	return { ...VERSION, ...overrides };
}

describe('VERSION semantic version object', () => {
	it('should have correct major, minor, patch, and prerelease values from package.json', () => {
		expect(VERSION.major).toBe(expectedMajor);
		expect(VERSION.minor).toBe(expectedMinor);
		expect(VERSION.patch).toBe(expectedPatch);
		expect(VERSION.prerelease).toBe(expectedPrerelease);
	});

	it('should return the full version string matching package.json', () => {
		expect(VERSION.toString()).toBe(pkg.version);
	});

	it('should not throw when toString is called', () => {
		expect(() => VERSION.toString()).not.toThrow();
	});

	it.each([
		['beta', `${expectedMajor}.${expectedMinor}.${expectedPatch}-beta`],
		['rc', `${expectedMajor}.${expectedMinor}.${expectedPatch}-rc`],
		['123', `${expectedMajor}.${expectedMinor}.${expectedPatch}-123`],
	])('should format toString correctly for prerelease "%s"', (pre, expected) => {
		expect(makeVersion({ prerelease: pre }).toString()).toBe(expected);
	});

	it('should omit the hyphen and prerelease segment when prerelease is empty', () => {
		expect(makeVersion({ prerelease: '' }).toString()).toBe(
			`${expectedMajor}.${expectedMinor}.${expectedPatch}`
		);
	});

	it('should coerce a numeric prerelease to string via template literal', () => {
		// @ts-ignore — intentional type violation to verify runtime coercion
		expect(makeVersion({ prerelease: 123 }).toString()).toBe(
			`${expectedMajor}.${expectedMinor}.${expectedPatch}-123`
		);
	});

	it('should reflect arbitrary major/minor/patch overrides in toString()', () => {
		expect(makeVersion({ major: 1, minor: 0, patch: 0, prerelease: 'stable' }).toString()).toBe(
			'1.0.0-stable'
		);
	});

	it('should handle negative or large version numbers in toString()', () => {
		expect(makeVersion({ major: -1, minor: 999, patch: 0 }).toString()).toBe(
			`-1.999.0-${VERSION.prerelease}`
		);
	});
});
