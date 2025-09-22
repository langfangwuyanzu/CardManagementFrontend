import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 保持已有的 --host 效果
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 本地后端
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // 去掉前缀
      }
    }
    
  },
  
})
//npx cloudflared tunnel --url http://localhost:5173
