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
