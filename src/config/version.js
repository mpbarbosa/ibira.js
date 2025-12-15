// version.js
// Semantic versioning configuration
// Copyright (c) 2025 Marcelo Pereira Barbosa
// License: MIT

// Semantic Versioning 2.0.0 - see https://semver.org/
// Version object for unstable development status
export const VERSION = {
	major: 0,
	minor: 2,
	patch: 1,
	prerelease: "alpha", // Indicates unstable development
	toString: function () {
		return `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;
	},
};
