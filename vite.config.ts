import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // Three.js is only pulled in by the lazily loaded 3D scenes, so its chunk
    // is large but never part of the initial critical path.
    chunkSizeWarningLimit: 1000,
  },
});
