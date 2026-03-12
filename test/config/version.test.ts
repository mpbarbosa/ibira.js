/**
 * @fileoverview Tests for Semantic versioning configuration in ibira.js
 * @module config/version.test
 */

import { VERSION } from '../../src/config/version';

describe('VERSION semantic version object', () => {
  it('should have correct major, minor, patch, and prerelease values', () => {
    expect(VERSION.major).toBe(0);
    expect(VERSION.minor).toBe(3);
    expect(VERSION.patch).toBe(1);
    expect(VERSION.prerelease).toBe('alpha');
  });

  it('should return correct version string with toString()', () => {
    expect(VERSION.toString()).toBe('0.3.2-alpha');
  });

  it('should format version string correctly for different prerelease values', () => {
    const original = VERSION.prerelease;
    VERSION.prerelease = 'beta';
    expect(VERSION.toString()).toBe('0.3.1-beta');
    VERSION.prerelease = 'rc';
    expect(VERSION.toString()).toBe('0.3.1-rc');
    VERSION.prerelease = original; // restore
  });

  it('should handle empty prerelease identifier', () => {
    const original = VERSION.prerelease;
    VERSION.prerelease = '';
    expect(VERSION.toString()).toBe('0.3.1-');
    VERSION.prerelease = original; // restore
  });

  it('should handle numeric prerelease identifier', () => {
    const original = VERSION.prerelease;
    // @ts-ignore
    VERSION.prerelease = 123;
    expect(VERSION.toString()).toBe('0.3.1-123');
    VERSION.prerelease = original; // restore
  });

  it('should handle negative and large version numbers', () => {
    const origMajor = VERSION.major;
    const origMinor = VERSION.minor;
    const origPatch = VERSION.patch;
    VERSION.major = -1;
    VERSION.minor = 999;
    VERSION.patch = 0;
    expect(VERSION.toString()).toBe('-1.999.0-alpha');
    VERSION.major = origMajor;
    VERSION.minor = origMinor;
    VERSION.patch = origPatch;
  });

  it('should not throw when toString is called', () => {
    expect(() => VERSION.toString()).not.toThrow();
  });

  it('should allow dynamic version updates and reflect in toString()', () => {
    const origMajor = VERSION.major;
    const origMinor = VERSION.minor;
    const origPatch = VERSION.patch;
    const origPrerelease = VERSION.prerelease;
    VERSION.major = 1;
    VERSION.minor = 0;
    VERSION.patch = 0;
    VERSION.prerelease = 'stable';
    expect(VERSION.toString()).toBe('1.0.0-stable');
    VERSION.major = origMajor;
    VERSION.minor = origMinor;
    VERSION.patch = origPatch;
    VERSION.prerelease = origPrerelease;
  });
});
