// vite.config-1.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Servir para LAN y forzar HMR al hostname/IP de tu red
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "192.168.1.70", // <-- tu IP LAN (ajústala si cambia)
      port: 5173,
      clientPort: 5173,
      protocol: "ws",
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: false,
        cookieDomainRewrite: { "*": "" },
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const key = "set-cookie";
            if (proxyRes.headers[key]) {
              proxyRes.headers[key] = proxyRes.headers[key].map((cookie) =>
                cookie
                  .replace(/Domain=[^;]+;?\s*/i, "")
                  .replace(/;\s*SameSite=None/i, "")
              );
            }
          });
        },
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
