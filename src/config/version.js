// version.js
// Semantic versioning configuration
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

/**
 * Semantic version object following SemVer 2.0.0 specification
 * @see https://semver.org/
 * @type {Object}
 * @property {number} major - Major version number (breaking changes)
 * @property {number} minor - Minor version number (new features, backward compatible)
 * @property {number} patch - Patch version number (bug fixes)
 * @property {string} prerelease - Prerelease identifier (alpha, beta, rc)
 * @property {function} toString - Returns the full version string
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
