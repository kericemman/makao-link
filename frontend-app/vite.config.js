import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"]
  },
  server: {
    port: 5177,
    strictPort: true,
    fs: { allow: [appRoot, path.resolve(appRoot, "../frontend-landlord")] }
  }
});
