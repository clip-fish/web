import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
    svgr(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  define: {
    global: 'window'
  },
  server: {
    host: '0.0.0.0', // Allow access from any network interface
    port: 5173,      // Default Vite port, change if needed
    strictPort: true, // Ensures the exact port is used
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
})
