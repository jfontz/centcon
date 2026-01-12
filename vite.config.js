import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const modemIp = env.VITE_MODEM_IP;
  const modemUrl = `http://${modemIp}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: modemUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Referer", `${modemUrl}/`);
              proxyReq.setHeader("Origin", modemUrl);
            });
          },
        },
      },
    },
  };
});
