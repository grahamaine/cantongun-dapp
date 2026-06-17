import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy the Daml JSON API so the browser talks to the privacy-aware ledger.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/v1": {
        target: "http://localhost:7575",
        changeOrigin: true,
      },
    },
  },
});
