
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative path so assets resolve correctly regardless of repo name or domain
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});

