import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ganti './' menjadi nama repositori lengkap: '/sipandai/'
export default defineConfig({
  plugins: [react()],
  base: '/sipandai/'
})