import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    watch: { usePolling: false },
    hmr: {
      overlay: false // ⬅️ evita que el overlay interrumpa en errores de desarrollo
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
