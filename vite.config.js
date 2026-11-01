import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' memastikan path aset cocok di-deploy ke GitHub Pages maupun hosting statis
export default defineConfig({
  plugins: [react()],
  base: './'
})