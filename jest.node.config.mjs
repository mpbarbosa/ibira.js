/**
 * Jest configuration for Node.js environment testing.
 *
 * Runs the full test suite against a Node.js runtime (no DOM) to verify
 * that ibira.js works correctly outside the browser. All 185+ tests are
 * expected to pass unmodified — ibira.js uses no browser-only APIs.
 *
 * Usage:
 *   npm run test:node
 *   npx jest --config jest.node.config.mjs
 */
export default {
	testEnvironment: 'node',
	collectCoverageFrom: [
		'src/**/*.js',
		'!src/index.js',
		'!src/**/*.test.js',
		'!**/node_modules/**',
	],
	coverageReporters: ['text', 'lcov', 'html'],
	coverageThreshold: {
		global: {
			branches: 75,
			functions: 75,
			lines: 75,
			statements: 75,
		},
	},
};
