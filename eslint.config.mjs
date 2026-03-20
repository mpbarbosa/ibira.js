/**
 * @fileoverview ESLint flat configuration for ibira.js
 * @module eslint.config
 */

import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

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
		files: ['src/**/*.ts', 'test/**/*.ts'],
		plugins: { '@typescript-eslint': tseslint },
		languageOptions: {
			parser: tsparser,
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			// TypeScript handles undefined-variable detection — disable the JS rule
			'no-undef': 'off',
			// Replaced by the TypeScript-aware version below
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'error',
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
