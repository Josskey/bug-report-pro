import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/", // 👈 гарантирует правильный путь к public-файлам
  plugins: [react()],
  server: {
    fs: {
      strict: false // 👈 разрешает доступ к public/
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

