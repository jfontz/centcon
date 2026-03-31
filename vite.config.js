import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const routerIp = env.VITE_ROUTER_IP;
  const routerUrl = `http://${routerIp}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: routerUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Referer", `${routerUrl}/`);
              proxyReq.setHeader("Origin", routerUrl);
            });
          },
        },
      },
    },
  };
});
