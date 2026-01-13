import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/songs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tags': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/playlists': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/stream': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
