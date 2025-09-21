// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,   // 👈 always use 3000
//     strictPort: true // 👈 fail if 3000 is busy (instead of picking another)
//   }
// })

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  // Load .env (both VITE_* and others because of the '' prefix)
  const env = loadEnv(mode, process.cwd(), '')

  const port = Number(env.VITE_PORT || env.PORT || 5173)
  const strictPort =
    String(env.VITE_STRICT_PORT ?? 'true').toLowerCase() === 'true'
  const host = env.VITE_HOST || 'localhost'

  return {
    plugins: [react()],
    server: {
      port,
      strictPort, // if true, Vite will fail instead of picking another port
      host
    }
  }
})
