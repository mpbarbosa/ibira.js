import { defineConfig } from 'tsup';

export default defineConfig({
entry: ['src/index.ts'],
format: ['cjs', 'esm'],
outDir: 'dist',
dts: true,
clean: true,
sourcemap: false,
minify: false,
splitting: false,
target: 'es2022',
});
