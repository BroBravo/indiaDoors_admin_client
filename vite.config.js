// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const port = Number(env.VITE_PORT || env.PORT || 5173)
  const strictPort = String(env.VITE_STRICT_PORT ?? 'true').toLowerCase() === 'true'
  const host = env.VITE_HOST || 'localhost'

  // 👇 always controlled by .env (e.g., "/" in dev, "/admin/" in prod)
  const base = env.VITE_BASE || '/'

  return {
    base,
    plugins: [react()],
    server: { port, strictPort, host },
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    }
  }
})
