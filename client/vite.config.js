import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    // Lets the dev site call the API on the same origin, matching production.
    proxy: {
      '/api': { target: 'http://localhost:5010', changeOrigin: true },
      '/sitemap.xml': { target: 'http://localhost:5010', changeOrigin: true },
      '/sitemap-pages.xml': { target: 'http://localhost:5010', changeOrigin: true },
      '/sitemap-fleet.xml': { target: 'http://localhost:5010', changeOrigin: true },
      '/sitemap-blog.xml': { target: 'http://localhost:5010', changeOrigin: true },
      '/sitemap-locations.xml': { target: 'http://localhost:5010', changeOrigin: true },
      '/robots.txt': { target: 'http://localhost:5010', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keeps the initial bundle small: Firebase only loads with auth pages,
        // and the admin CMS is a separate chunk the public site never fetches.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('react-router')) return 'router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'react';
          }
          return 'vendor';
        },
      },
    },
  },
});
