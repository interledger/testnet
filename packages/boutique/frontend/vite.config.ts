import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        // Read the theme from the environment variable
        return html.replace(
          '<html class="',
          `<html class="${process.env.VITE_THEME ?? 'light'} `
        )
      }
    }
  ],
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
