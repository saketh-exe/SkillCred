import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // MediaPipe loads its own WASM — pre-bundling breaks WASM path resolution
    exclude: ['@mediapipe/tasks-vision'],
  },
  server: {
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
