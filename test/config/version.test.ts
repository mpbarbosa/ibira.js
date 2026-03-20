/**
 * @fileoverview Tests for Semantic versioning configuration in ibira.js
 * @module config/version.test
 */

import { VERSION } from '../../src/config/version';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json') as { version: string };
const dashIdx = pkg.version.indexOf('-');
const versionCore = dashIdx === -1 ? pkg.version : pkg.version.slice(0, dashIdx);
const prerelease = dashIdx === -1 ? '' : pkg.version.slice(dashIdx + 1);
const [major, minor, patch] = versionCore.split('.').map(Number);

describe('VERSION semantic version object', () => {
  it('should have correct major, minor, patch, and prerelease values', () => {
    expect(VERSION.major).toBe(major);
    expect(VERSION.minor).toBe(minor);
    expect(VERSION.patch).toBe(patch);
    expect(VERSION.prerelease).toBe(prerelease);
  });

  it('should return correct version string with toString()', () => {
    expect(VERSION.toString()).toBe(pkg.version);
  });

  it('should format version string correctly for different prerelease values', () => {
    const betaVersion = { ...VERSION, prerelease: 'beta' };
    expect(betaVersion.toString()).toBe(`${major}.${minor}.${patch}-beta`);
    const rcVersion = { ...VERSION, prerelease: 'rc' };
    expect(rcVersion.toString()).toBe(`${major}.${minor}.${patch}-rc`);
  });

  it('should handle empty prerelease identifier', () => {
    const emptyVersion = { ...VERSION, prerelease: '' };
    expect(emptyVersion.toString()).toBe(`${major}.${minor}.${patch}-`);
  });

  it('should handle numeric prerelease identifier', () => {
    // @ts-ignore
    const numericVersion = { ...VERSION, prerelease: 123 };
    expect(numericVersion.toString()).toBe(`${major}.${minor}.${patch}-123`);
  });

  it('should handle negative and large version numbers', () => {
    const v = { ...VERSION, major: -1, minor: 999, patch: 0 };
    expect(v.toString()).toBe(`-1.999.0-${VERSION.prerelease}`);
  });

  it('should not throw when toString is called', () => {
    expect(() => VERSION.toString()).not.toThrow();
  });

  it('should allow dynamic version updates and reflect in toString()', () => {
    const updatedVersion = { ...VERSION, major: 1, minor: 0, patch: 0, prerelease: 'stable' };
    expect(updatedVersion.toString()).toBe('1.0.0-stable');
  });
});
