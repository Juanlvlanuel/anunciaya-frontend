import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dns from "dns";

dns.setDefaultResultOrder?.("ipv4first");

const DEV_TARGET = process.env.VITE_DEV_API_TARGET || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: { overlay: false },
    proxy: {
      "/api": {
        target: DEV_TARGET,
        changeOrigin: true,
        secure: false,
        ws: false,
        cookieDomainRewrite: { "*": "" },
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const key = "set-cookie";
            const sc = proxyRes.headers[key];
            if (sc) {
              proxyRes.headers[key] = sc.map((cookie) =>
                cookie
                  .replace(/;\s*Domain=[^;]+/i, "")
                  .replace(/;\s*SameSite=None/ig, "; SameSite=Lax")
              );
            }
          });
          proxy.on("error", () => {});
        },
      },
      // 👇 Quitamos por completo el proxy de /socket.io para evitar logs ECONNABORTED
    },
    watch: { usePolling: true, interval: 300 },
  },
});
