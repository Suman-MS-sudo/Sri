import { createClient, type RealtimeChannel } from '@supabase/supabase-js'

// A room is a channel two phones talk through. Messages are tiny JSON events; nothing is stored.
//   live:  Supabase Realtime, phones anywhere in the world
//   wifi:  the dev server relays messages, any device on the same network (npm run dev)
//   tabs:  tabs of one browser only, for trying things out

export type Message = { type: string; from: string; [k: string]: unknown }
export type Room = { send: (m: Message) => void; leave: () => void }
type Handlers = { onMessage: (m: Message) => void; onOnline: (ids: string[]) => void }

const env = import.meta.env as Record<string, string | undefined>
const URL = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = URL && KEY ? createClient(URL, KEY, { auth: { persistSession: false } }) : null
const hot = import.meta.hot

export type Mode = 'live' | 'wifi' | 'tabs'
export const MODE: Mode = supabase ? 'live' : hot ? 'wifi' : 'tabs'
export const LIVE = MODE === 'live'

export function joinRoom(code: string, me: string, h: Handlers): Room {
  if (supabase) return supabaseRoom(code, me, h)
  if (hot) return pipeRoom(me, h, relayPipe(code))
  return pipeRoom(me, h, tabsPipe(code))
}

function supabaseRoom(code: string, me: string, h: Handlers): Room {
  const channel: RealtimeChannel = supabase!.channel(`love-${code}`, { config: { broadcast: { self: false }, presence: { key: me } } })
  channel
    .on('broadcast', { event: 'msg' }, ({ payload }) => h.onMessage(payload as Message))
    .on('presence', { event: 'sync' }, () => h.onOnline(Object.keys(channel.presenceState())))
    .subscribe(status => {
      if (status === 'SUBSCRIBED') void channel.track({ at: Date.now() })
    })
  return {
    send: m => void channel.send({ type: 'broadcast', event: 'msg', payload: m }),
    leave: () => void supabase!.removeChannel(channel),
  }
}

// ---- the two simple pipes, with presence worked out from regular pings ----
type Pipe = { post: (m: Message) => void; subscribe: (fn: (m: Message) => void) => void; close: () => void }

function relayPipe(code: string): Pipe {
  let handler: ((d: { room: string; m: Message }) => void) | null = null
  return {
    post: m => hot!.send('love:msg', { room: code, m }),
    subscribe: fn => {
      handler = d => { if (d.room === code) fn(d.m) }
      hot!.on('love:msg', handler)
    },
    close: () => { if (handler) hot!.off?.('love:msg', handler) },
  }
}

function tabsPipe(code: string): Pipe {
  const bc = new BroadcastChannel(`love-${code}`)
  return {
    post: m => bc.postMessage(m),
    subscribe: fn => { bc.onmessage = e => fn(e.data as Message) },
    close: () => bc.close(),
  }
}

function pipeRoom(me: string, h: Handlers, pipe: Pipe): Room {
  const seen = new Map<string, number>([[me, Date.now()]])
  let last = ''
  const report = () => {
    const now = Date.now()
    for (const [id, t] of seen) if (id !== me && now - t > 5000) seen.delete(id)
    const ids = [...seen.keys()].sort()
    if (ids.join() !== last) { last = ids.join(); h.onOnline(ids) } // only when someone comes or goes
  }
  pipe.subscribe(m => {
    if (m.from === me) return
    seen.set(m.from, Date.now())
    if (m.type !== 'ping') h.onMessage(m)
    report()
  })
  const ping = () => pipe.post({ type: 'ping', from: me })
  ping()
  const timer = setInterval(() => { ping(); report() }, 1500)
  report()
  return { send: m => pipe.post(m), leave: () => { clearInterval(timer); pipe.close() } }
}
