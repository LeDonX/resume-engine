import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-static",
    // NOTE: esbuild minification is crashing in the current Windows + Node 24
    // environment used by local Cloudflare/Wrangler deployment. Disabling JS
    // minification keeps the build stable so the project can be deployed
    // directly via `wrangler deploy`.
    minify: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html")
      }
    }
  }
});
