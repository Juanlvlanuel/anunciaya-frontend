import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

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
        configure: (proxy, options) => {
          proxy.on('proxyRes', function (proxyRes, req, res) {
            const key = 'set-cookie';
            proxyRes.headers[key] = proxyRes.headers[key] && proxyRes.headers[key].map(cookie => {
              // Fuerza dominio vacío para que se guarde en localhost:5173
              return cookie.replace(/Domain=[^;]+;?\s*/i, '');
            });
          });
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
});
