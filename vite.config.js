import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dns from "dns";
import fs from "fs";
import path from "path";

dns.setDefaultResultOrder?.("ipv4first");

const DEV_TARGET = process.env.VITE_DEV_API_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
    },
    proxy: {
      "/api": {
        target: DEV_TARGET,
        changeOrigin: true,
        secure: false,
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
        },
      },
    },
  },
  watch: { usePolling: true, interval: 300 },
});