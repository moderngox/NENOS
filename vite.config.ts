import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Run `npm run dev:worker` (wrangler dev on :8787) alongside `npm run dev`
    // so the Vite dev server (hot reload) can still reach the real /api/* worker.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
