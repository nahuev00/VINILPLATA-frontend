import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      // Solo dejamos el proxy normal para tus peticiones REST (GET, POST, etc.)
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
