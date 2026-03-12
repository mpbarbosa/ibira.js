// __tests__/version.test.js

import { VERSION } from '../../src/config/version';

describe('VERSION semantic version object', () => {
  it('should have correct initial values', () => {
    expect(VERSION.major).toBe(0);
    expect(VERSION.minor).toBe(3);
    expect(VERSION.patch).toBe(1);
    expect(VERSION.prerelease).toBe('alpha');
  });

  it('should return correct version string for default values', () => {
    expect(VERSION.toString()).toBe('0.3.2-alpha');
  });

  it('should return correct version string for beta prerelease', () => {
    const betaVersion = { ...VERSION, prerelease: 'beta' };
    expect(betaVersion.toString()).toBe('0.3.1-beta');
  });

  it('should return correct version string for rc prerelease', () => {
    const rcVersion = { ...VERSION, prerelease: 'rc' };
    expect(rcVersion.toString()).toBe('0.3.1-rc');
  });

  it('should handle numeric prerelease values', () => {
    const numericVersion = { ...VERSION, prerelease: '1' };
    expect(numericVersion.toString()).toBe('0.3.1-1');
  });

  it('should handle empty prerelease string', () => {
    const emptyVersion = { ...VERSION, prerelease: '' };
    expect(emptyVersion.toString()).toBe('0.3.1-');
  });

  it('should handle negative version numbers', () => {
    const negativeVersion = { ...VERSION, major: -1, minor: -2, patch: -3 };
    expect(negativeVersion.toString()).toBe('-1.-2.-3-alpha');
  });

  it('should handle large version numbers', () => {
    const largeVersion = { ...VERSION, major: 999, minor: 888, patch: 777 };
    expect(largeVersion.toString()).toBe('999.888.777-alpha');
  });

  it('should handle missing prerelease property gracefully', () => {
    const missingPrerelease = { ...VERSION, prerelease: undefined, toString: function () {
      return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
    }};
    expect(missingPrerelease.toString()).toBe('0.3.1-undefined');
  });

  it('should handle non-string prerelease values', () => {
    const objPrerelease = { ...VERSION, prerelease: { stage: 'alpha' }, toString: function () {
      return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
    }};
    expect(objPrerelease.toString()).toBe('0.3.1-[object Object]');
  });

  it('should not throw when calling toString with incomplete object', () => {
    const incompleteVersion = { major: 1, minor: 2, patch: 3, toString: VERSION.toString };
    expect(incompleteVersion.toString()).toBe('1.2.3-undefined');
  });
});
