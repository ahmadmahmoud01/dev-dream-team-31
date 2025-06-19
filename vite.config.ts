import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add buffer polyfill
      "buffer": "buffer",
    },
  },
  define: {
    // Define global for browser compatibility
    global: 'globalThis',
  },
  optimizeDeps: {
    // Include buffer in dependency optimization
    include: ['buffer'],
  },
}));
