// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',        // o true / '0.0.0.0' si quieres exponer en LAN
    port: 5173,
    strictPort: true,
    watch: { usePolling: false },
    hmr: { overlay: false },

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // hace que la cookie no traiga Domain=... (necesario en localhost)
        cookieDomainRewrite: '',
        // fuerza Path=/ en las cookies
        cookiePathRewrite: '/'
      },

      // Sólo si en local usas socket.io contra el backend
      // '/socket.io': {
      //   target: 'http://localhost:5000',
      //   ws: true,
      //   changeOrigin: true,
      //   secure: false,
      //   cookieDomainRewrite: '',
      //   cookiePathRewrite: '/'
      // }
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
});
