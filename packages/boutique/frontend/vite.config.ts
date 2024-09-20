import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  define: {
    VITE_CURRENCY: `'${process.env.VITE_CURRENCY}'`
  },
  plugins: [react()],
  server: {
    port: 4004
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@boutique/shared': resolve(__dirname, '../../boutique/shared/src')
    }
  }
})
