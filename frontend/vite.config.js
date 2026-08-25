import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.BACKEND_URL || "http://localhost:4000";

  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT_FRONTEND) || 5173,
      // En desarrollo el frontend habla con /api y Vite lo reenvía al backend,
      // así no hace falta CORS ni tocar VITE_API_URL.
      proxy: {
        "/api": { target: backend, changeOrigin: true },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
    },
  };
});
