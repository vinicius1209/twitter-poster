import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "..", "src", "shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyDirBeforeBuild: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3847",
    },
  },
});
