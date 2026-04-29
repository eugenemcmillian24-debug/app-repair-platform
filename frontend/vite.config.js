import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app-repair-platform/', // GitHub Pages base path
  build: {
    outDir: 'dist',
  },
})
