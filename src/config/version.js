/**
 * @fileoverview Semantic versioning configuration for ibira.js
 * @module config/version
 * @license MIT
 * @copyright 2025 Marcelo Pereira Barbosa
 * @see {@link https://semver.org/|Semantic Versioning 2.0.0}
 */

/**
 * Semantic version object following SemVer 2.0.0 specification
 * 
 * The version format is MAJOR.MINOR.PATCH-PRERELEASE where:
 * - MAJOR version increments for incompatible API changes
 * - MINOR version increments for backward-compatible new features
 * - PATCH version increments for backward-compatible bug fixes
 * - PRERELEASE identifier indicates unstable development (alpha, beta, rc)
 * 
 * @constant
 * @type {Object}
 * @property {number} major - Major version number (breaking changes)
 * @property {number} minor - Minor version number (new features, backward compatible)
 * @property {number} patch - Patch version number (bug fixes)
 * @property {string} prerelease - Prerelease identifier (alpha, beta, rc)
 * @property {Function} toString - Returns the full version string
 * 
 * @example
 * import { VERSION } from 'ibira.js';
 * console.log(VERSION.toString()); // "0.2.1-alpha"
 * console.log(`v${VERSION.major}.${VERSION.minor}.${VERSION.patch}`);
 */
export const VERSION = {
	major: 0,
	minor: 2,
	patch: 1,
	prerelease: "alpha", // Indicates unstable development
	toString: function () {
		return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
	},
};
