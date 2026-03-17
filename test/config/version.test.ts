/**
 * @fileoverview Tests for Semantic versioning configuration in ibira.js
 * @module config/version.test
 */

import { VERSION } from '../../src/config/version';

describe('VERSION semantic version object', () => {
  it('should have correct major, minor, patch, and prerelease values', () => {
    expect(VERSION.major).toBe(0);
    expect(VERSION.minor).toBe(3);
    expect(VERSION.patch).toBe(5);
    expect(VERSION.prerelease).toBe('alpha');
  });

  it('should return correct version string with toString()', () => {
    expect(VERSION.toString()).toBe('0.3.6-alpha');
  });

  it('should format version string correctly for different prerelease values', () => {
    const betaVersion = { ...VERSION, prerelease: 'beta' };
    expect(betaVersion.toString()).toBe('0.3.5-beta');
    const rcVersion = { ...VERSION, prerelease: 'rc' };
    expect(rcVersion.toString()).toBe('0.3.5-rc');
  });

  it('should handle empty prerelease identifier', () => {
    const emptyVersion = { ...VERSION, prerelease: '' };
    expect(emptyVersion.toString()).toBe('0.3.5-');
  });

  it('should handle numeric prerelease identifier', () => {
    // @ts-ignore
    const numericVersion = { ...VERSION, prerelease: 123 };
    expect(numericVersion.toString()).toBe('0.3.5-123');
  });

  it('should handle negative and large version numbers', () => {
    const v = { ...VERSION, major: -1, minor: 999, patch: 0 };
    expect(v.toString()).toBe('-1.999.0-alpha');
  });

  it('should not throw when toString is called', () => {
    expect(() => VERSION.toString()).not.toThrow();
  });

  it('should allow dynamic version updates and reflect in toString()', () => {
    const updatedVersion = { ...VERSION, major: 1, minor: 0, patch: 0, prerelease: 'stable' };
    expect(updatedVersion.toString()).toBe('1.0.0-stable');
  });
});
