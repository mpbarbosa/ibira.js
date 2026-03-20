#!/usr/bin/env node
/**
 * @fileoverview Syncs src/config/version.ts with the canonical version in package.json.
 * @module scripts/sync-version
 * @license MIT
 * @copyright 2026 Marcelo Pereira Barbosa
 *
 * Usage:
 *   node scripts/sync-version.js          Regenerate src/config/version.ts from package.json
 *   node scripts/sync-version.js --check  Exit 1 if version.ts is out of sync with package.json
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const VERSION_TS_PATH = path.join(ROOT, 'src', 'config', 'version.ts');

/**
 * Parse a semver string into its component parts.
 *
 * @param {string} versionString - e.g. "0.3.6-alpha"
 * @returns {{ major: number, minor: number, patch: number, prerelease: string }}
 */
function parseVersion(versionString) {
	const dashIdx = versionString.indexOf('-');
	const core = dashIdx === -1 ? versionString : versionString.slice(0, dashIdx);
	const prerelease = dashIdx === -1 ? '' : versionString.slice(dashIdx + 1);
	const [major, minor, patch] = core.split('.').map(Number);
	return { major, minor, patch, prerelease };
}

/**
 * Generate the content of src/config/version.ts for the given version parts.
 *
 * @param {{ major: number, minor: number, patch: number, prerelease: string }} version
 * @returns {string}
 */
function generateVersionTs({ major, minor, patch, prerelease }) {
	const versionString = prerelease
		? `${major}.${minor}.${patch}-${prerelease}`
		: `${major}.${minor}.${patch}`;

	return [
		'/**',
		' * @fileoverview Semantic versioning configuration for ibira.js',
		' * @module config/version',
		' * @license MIT',
		' * @copyright 2026 Marcelo Pereira Barbosa',
		' * @see {@link https://semver.org/|Semantic Versioning 2.0.0}',
		' */',
		'',
		'/**',
		' * Semantic version object following SemVer 2.0.0 specification',
		' *',
		' * The version format is MAJOR.MINOR.PATCH-PRERELEASE where:',
		' * - MAJOR version increments for incompatible API changes',
		' * - MINOR version increments for backward-compatible new features',
		' * - PATCH version increments for backward-compatible bug fixes',
		' * - PRERELEASE identifier indicates unstable development (alpha, beta, rc)',
		' *',
		' * @constant',
		' * @type {Object}',
		' * @property {number} major - Major version number (breaking changes)',
		' * @property {number} minor - Minor version number (new features, backward compatible)',
		' * @property {number} patch - Patch version number (bug fixes)',
		' * @property {string} prerelease - Prerelease identifier (alpha, beta, rc)',
		' * @property {Function} toString - Returns the full version string',
		' *',
		' * @example',
		" * import { VERSION } from 'ibira.js';",
		` * console.log(VERSION.toString()); // "${versionString}"`,
		' * console.log(`v${VERSION.major}.${VERSION.minor}.${VERSION.patch}`);',
		' */',
		'export const VERSION: {',
		'\tmajor: number;',
		'\tminor: number;',
		'\tpatch: number;',
		'\tprerelease: string;',
		'\ttoString(): string;',
		'} = {',
		`\tmajor: ${major},`,
		`\tminor: ${minor},`,
		`\tpatch: ${patch},`,
		`\tprerelease: "${prerelease}", // Indicates unstable development`,
		'\ttoString(): string {',
		'\t\treturn `${this.major}.${this.minor}.${this.patch}-${this.prerelease}`;',
		'\t},',
		'};',
		'',
	].join('\n');
}

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const parsed = parseVersion(pkg.version);
const expected = generateVersionTs(parsed);
const checkMode = process.argv.includes('--check');

if (checkMode) {
	const current = fs.existsSync(VERSION_TS_PATH)
		? fs.readFileSync(VERSION_TS_PATH, 'utf8')
		: '';
	if (current === expected) {
		console.log(`✅  version.ts is in sync with package.json (${pkg.version})`);
		process.exit(0);
	} else {
		console.error(`❌  version.ts is out of sync with package.json (${pkg.version})`);
		console.error('    Run: npm run version:sync');
		process.exit(1);
	}
} else {
	fs.writeFileSync(VERSION_TS_PATH, expected, 'utf8');
	console.log(`✅  Synced version.ts → ${pkg.version}`);
}
