import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4004
  },
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }]
  }
})
