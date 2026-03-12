/**
 * @fileoverview ESLint flat configuration for ibira.js
 * @module eslint.config
 */

import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ['src/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			// Errors
			'no-undef': 'error',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'no-console': 'warn',
			'no-debugger': 'error',

			// Style — match existing code conventions
			'semi': ['error', 'always'],
			'no-var': 'error',
			'prefer-const': 'error',
			'eqeqeq': ['error', 'always'],
			'curly': ['error', 'all'],
		},
	},
	{
		files: ['__tests__/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
			},
		},
		rules: {
			'no-undef': 'error',
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
		},
	},
];
