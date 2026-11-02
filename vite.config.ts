import { defineConfig, type Plugin } from 'vite'
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

export default defineConfig({
  plugins: [react(), basicSsl(), loveRelay()],
  // NEXT_PUBLIC_* is what Vercel's Supabase integration creates; VITE_* works for manual setup.
  // Only the public URL and anon key are read in the app.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
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
})
