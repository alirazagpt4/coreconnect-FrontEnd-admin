import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://62.171.183.182/api', // Asli backend address
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Path adjustment
      }
    }
  }
})