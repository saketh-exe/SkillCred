import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // MediaPipe loads its own WASM — pre-bundling breaks WASM path resolution
    // face-api.js has complex conditional imports that confuse the pre-bundler
    exclude: ['@mediapipe/tasks-vision', '@vladmandic/face-api'],
  },
  server: {
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
