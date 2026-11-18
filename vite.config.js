import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL('./client', import.meta.url)),
  envDir: fileURLToPath(new URL('./', import.meta.url)),
  base: mode === 'pages' ? '/breadcrumbs/' : '/',
  build: { outDir: '../dist', emptyOutDir: true },
}));
