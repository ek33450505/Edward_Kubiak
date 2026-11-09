import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  build: {
    // Never inline fonts as data: URIs — CSP is `font-src 'self'` (no data:),
    // so an inlined woff2 subset would be blocked. Fonts must be real files.
    assetsInlineLimit(filePath) {
      if (/\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(filePath)) return false;
      return undefined; // Vite default (4096) for all other assets
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/motion/')) {
            return 'motion';
          }
        },
      },
    },
  },
})
