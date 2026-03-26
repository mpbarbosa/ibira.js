import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	outDir: 'dist',
	dts: true,
	clean: true,
	sourcemap: true,
	minify: false,
	splitting: false,
	target: 'es2022',
	// Bundle bessa_patterns.ts so the ibira.js dist remains self-contained (zero peer deps)
	noExternal: ['bessa_patterns.ts'],
});
