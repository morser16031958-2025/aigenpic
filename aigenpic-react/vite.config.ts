import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/pic': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  },
  build: {
    outDir: 'dist',
  }
})
