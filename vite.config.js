import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    watch: { usePolling: false },
    hmr: { overlay: false },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        cookiePathRewrite: {
          '/api/usuarios/auth/refresh': '/api/usuarios/auth/refresh',
        },
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const key = 'set-cookie'
            proxyRes.headers[key] =
              proxyRes.headers[key] &&
              proxyRes.headers[key].map((cookie) =>
                cookie.replace(/Domain=[^;]+;?\s*/i, '')
              )
          })
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'react-icons',
      'react-toastify',
      'socket.io-client',
      'swiper'
    ]
  },
  css: { devSourcemap: false }
})
