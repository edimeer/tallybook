import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// GitHub Pages serves project sites from a subpath (https://user.github.io/<repo>/).
// Set VITE_BASE_PATH at build time to match it, for example "/my-repo/".
// The default "./" uses relative URLs, which works under any subpath (and at the root)
// because this app has no client-side routing.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || './'
  return {
    base,
    plugins: [react()],
  }
})
