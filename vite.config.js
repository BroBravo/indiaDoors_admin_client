import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,   // 👈 always use 3000
    strictPort: true // 👈 fail if 3000 is busy (instead of picking another)
  }
})
