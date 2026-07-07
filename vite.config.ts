import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import path from "node:path";
import manifest from "./manifest.config";

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: {
    alias: {
      "@domain": path.resolve(__dirname, "src/domain"),
      "@services": path.resolve(__dirname, "src/services"),
      "@background": path.resolve(__dirname, "src/background"),
      "@popup": path.resolve(__dirname, "src/popup"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@shared-types": path.resolve(__dirname, "src/types"),
    },
  },
  test: {
    environment: "node",
  },
});
