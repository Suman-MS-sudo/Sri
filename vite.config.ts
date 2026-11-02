import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

/**
 * Home Wi-Fi play: while the dev server runs, it passes game messages between every device that
 * has the site open (phones, laptops on the same network), over the dev server's own websocket.
 * Live play from anywhere uses Supabase instead (see docs/two-player-setup.md).
 */
function loveRelay(): Plugin {
  return {
    name: 'love-relay',
    apply: 'serve',
    configureServer(server) {
      server.ws.on('love:msg', (data, from) => {
        for (const client of server.ws.clients) if (client !== from) client.send('love:msg', data)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Supabase settings may arrive under several names, depending on how the Vercel integration was
  // set up. Only the project URL and the PUBLIC key are passed to the site; the integration also
  // adds secret keys (service role, Postgres password), which must never reach the browser.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env } as Record<string, string | undefined>
  const pick = (...names: string[]) => names.map(n => env[n]).find(Boolean) ?? ''
  const supabaseUrl = pick('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_SUPABASE_URL', 'SUPABASE_URL')
  const supabaseKey = pick(
    'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY',
    'VITE_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY',
  )

  return {
    plugins: [react(), basicSsl(), loveRelay()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    // reachable from phones on the same network, over https (needed for sharing and copying links)
    server: { host: true },
    preview: { host: true },
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: { react: ['react', 'react-dom'], motion: ['framer-motion'] },
        },
      },
    },
  }
})
