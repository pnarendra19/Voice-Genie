import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Any request to /api/... is forwarded to the Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});