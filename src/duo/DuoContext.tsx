import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { joinRoom, MODE, type Message, type Mode, type Room } from './transport'
import { applyMove, initBoard, isTurnGame, type Board, type Ended, type P } from './rules'

export type GameId = 'pong' | 'catch' | 'tug' | 'xo' | 'c4' | 'memory' | 'rps'
export type Result = { winner: string | null; scores: Record<string, number> }
export type GameState = {
  host: string
  players: Record<string, string> // id → name
  order: string[] // the two players, host first
  game: GameId | null
  phase: 'lobby' | 'play' | 'end'
  run: number // bumps every time a game starts, so both phones mount a fresh game
  result: Result | null
  wins: Record<string, number> // the tally across games
  board: Board | null // turn-based games keep their board here, so both phones see the same one
}
type Action =
  | { type: 'join'; id: string; name: string }
  | { type: 'start'; game: GameId }
  | { type: 'end'; result: Result }
  | { type: 'lobby' }
  | { type: 'move'; id: string; move: Record<string, unknown> }

const toResult = (s: GameState, e: Ended): Result => ({
  winner: e.winner === null ? null : s.order[e.winner],
  scores: { [s.order[0]]: e.scores[0], [s.order[1]]: e.scores[1] },
})
function finish(s: GameState, result: Result): GameState {
  if (s.phase !== 'play') return s
  const w = result.winner
  return { ...s, phase: 'end', result, wins: w ? { ...s.wins, [w]: (s.wins[w] ?? 0) + 1 } : s.wins }
}

/** The rules of the room. Only the room's creator runs this; the other phone sends it actions. */
function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'join': {
      if (s.players[a.id] === a.name) return s
      if (!s.players[a.id] && s.order.length >= 2) {
        // a room is for two; but if one of them comes back on a new tab or phone, give the seat back
        const old = s.order.find(id => id !== s.host && s.players[id].toLowerCase() === a.name.toLowerCase())
        if (!old) return s
        const swap = (id: string) => (id === old ? a.id : id)
        const rekey = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [swap(k), v]))
        const { [old]: _gone, ...rest } = s.players
        return { ...s, players: { ...rest, [a.id]: a.name }, order: s.order.map(swap), wins: rekey(s.wins), result: s.result && { ...s.result, winner: s.result.winner && swap(s.result.winner), scores: rekey(s.result.scores) } }
      }
      return { ...s, players: { ...s.players, [a.id]: a.name }, order: s.order.includes(a.id) ? s.order : [...s.order, a.id] }
    }
    case 'start':
      if (s.order.length < 2) return s
      return { ...s, game: a.game, phase: 'play', run: s.run + 1, result: null, board: isTurnGame(a.game) ? initBoard(a.game, s.run + 1) : null }
    case 'end':
      return finish(s, a.result)
    case 'move': {
      if (s.phase !== 'play' || !s.game || !isTurnGame(s.game) || !s.board) return s
      const p = s.order.indexOf(a.id)
      if (p < 0) return s
      const out = applyMove(s.game, s.board, p as P, a.move)
      if (!out) return s
      const next = { ...s, board: out.board }
      return out.end ? finish(next, toResult(s, out.end)) : next
    }
    case 'lobby':
      return { ...s, game: null, phase: 'lobby', result: null }
  }
}

// ---- identity and room code ----
// Each phone remembers who it is. In tabs-only test mode the two players are two tabs of one
// browser, so each tab keeps its own identity.
const storage = () => (MODE === 'tabs' ? sessionStorage : localStorage)
const store = {
  get: (k: string) => { try { return storage().getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { storage().setItem(k, v) } catch { /* private mode */ } },
  del: (k: string) => { try { storage().removeItem(k) } catch { /* private mode */ } },
}
const myId = (() => {
  let id = store.get('duo:id')
  if (!id) { id = Math.random().toString(36).slice(2, 10); store.set('duo:id', id) }
  return id
})()
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
const codeFromUrl = () => (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || null
const setUrlCode = (code: string | null) => {
  const u = new URL(location.href)
  if (code) u.searchParams.set('room', code)
  else u.searchParams.delete('room')
  history.replaceState(null, '', u)
}
export const inviteLink = (code: string) => {
  const u = new URL(location.href)
  u.search = `?room=${code}`
  u.hash = ''
  return u.toString()
}

type Listener = (m: Message) => void
/** A chat line. Chat is never stored: it lives in memory while the room is open. */
export type ChatMsg = { id: string; from: string; text: string; at: number }
const CHAT_KEEP = 50, CHAT_MAX = 200
type Duo = {
  me: string
  name: string
  setName: (n: string) => void
  code: string | null
  mode: Mode
  online: string[]
  state: GameState | null
  isHost: boolean
  partner: string | null
  create: () => void
  join: (code: string) => void
  leave: () => void
  act: (a: Action) => void
  /** fast game messages (positions, taps): not stored, just passed between the phones */
  send: (type: string, data: Record<string, unknown>) => void
  listen: (type: string, fn: Listener) => () => void
  chat: ChatMsg[]
  say: (text: string) => void
}
const DuoContext = createContext<Duo | null>(null)
export const useDuo = () => {
  const d = useContext(DuoContext)
  if (!d) throw new Error('useDuo needs DuoProvider')
  return d
}

/** One game room for the whole page, shared by every view of the app. */
export function DuoProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState(() => store.get('duo:name') || '')
  const [code, setCode] = useState<string | null>(() => codeFromUrl() || store.get('duo:room'))
  const [state, setState] = useState<GameState | null>(null)
  const [online, setOnline] = useState<string[]>([])
  const room = useRef<Room | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const listeners = useRef(new Map<string, Set<Listener>>())
  const [chat, setChat] = useState<ChatMsg[]>([])

  const isHost = !!code && store.get(`duo:host:${code}`) === myId
  const isHostRef = useRef(isHost)
  isHostRef.current = isHost

  const setName = (n: string) => { setNameState(n); store.set('duo:name', n) }

  // the host applies an action, saves the result, and tells the other phone
  const apply = useCallback((a: Action) => {
    const cur = stateRef.current
    if (!cur) return
    const next = reduce(cur, a)
    if (next === cur) return
    stateRef.current = next
    setState(next)
    // a game in progress can't be resumed after a refresh, so it is saved as the lobby
    if (code) store.set(`duo:state:${code}`, JSON.stringify(next.phase === 'play' ? { ...next, phase: 'lobby', game: null } : next))
    room.current?.send({ type: 'state', from: myId, state: next })
  }, [code])

  useEffect(() => {
    if (!code || !name) return
    store.set('duo:room', code)
    setUrlCode(code)

    if (isHostRef.current) {
      const saved = store.get(`duo:state:${code}`)
      const initial: GameState = saved
        ? JSON.parse(saved)
        : { host: myId, players: { [myId]: name }, order: [myId], game: null, phase: 'lobby', run: 0, result: null, wins: {}, board: null }
      initial.players[myId] = name
      stateRef.current = initial
      setState(initial)
    } else {
      stateRef.current = null
      setState(null)
    }

    const r = joinRoom(code, myId, {
      onMessage: (m: Message) => {
        if (m.type === 'hello' || m.type === 'action' || m.type === 'state') {
          if (isHostRef.current) {
            if (m.type === 'hello') { apply({ type: 'join', id: m.from, name: String(m.name) }); r.send({ type: 'state', from: myId, state: stateRef.current }) }
            if (m.type === 'action') apply(m.action as Action)
          } else if (m.type === 'state' && m.state) {
            stateRef.current = m.state as GameState
            setState(m.state as GameState)
          }
          return
        }
        listeners.current.get(m.type)?.forEach(fn => fn(m))
      },
      onOnline: ids => setOnline(prev => (prev.slice().sort().join() === ids.slice().sort().join() ? prev : ids)),
    })
    room.current = r
    // say hello until the host answers with the room
    const hello = () => { if (!isHostRef.current) r.send({ type: 'hello', from: myId, name }) }
    hello()
    const t = setInterval(() => { if (!isHostRef.current && !stateRef.current?.players[myId]) hello() }, 2000)
    return () => { clearInterval(t); r.leave(); room.current = null }
  }, [code, name, apply])

  const act = useCallback((a: Action) => {
    if (isHostRef.current) apply(a)
    else room.current?.send({ type: 'action', from: myId, action: a })
  }, [apply])
  const send = useCallback((type: string, data: Record<string, unknown>) => room.current?.send({ ...data, type, from: myId }), [])
  const listen = useCallback((type: string, fn: Listener) => {
    const set = listeners.current.get(type) ?? new Set<Listener>()
    set.add(fn)
    listeners.current.set(type, set)
    return () => { set.delete(fn) }
  }, [])

  // chat: messages pass straight between the phones and are only kept in memory
  const addChat = useCallback((m: ChatMsg) => setChat(c => (c.some(x => x.id === m.id) ? c : [...c.slice(-(CHAT_KEEP - 1)), m])), [])
  useEffect(() => listen('chat', m => addChat({ id: String(m.id), from: m.from, text: String(m.text).slice(0, CHAT_MAX), at: Date.now() })), [listen, addChat])
  useEffect(() => setChat([]), [code])
  const say = useCallback((text: string) => {
    const t = text.trim().slice(0, CHAT_MAX)
    if (!t) return
    const msg: ChatMsg = { id: Math.random().toString(36).slice(2, 10), from: myId, text: t, at: Date.now() }
    addChat(msg)
    room.current?.send({ type: 'chat', from: myId, id: msg.id, text: t })
  }, [addChat])

  const create = () => { const c = newCode(); store.set(`duo:host:${c}`, myId); setCode(c) }
  const join = (c: string) => setCode(c.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  const leave = () => { if (code) store.del(`duo:state:${code}`); store.del('duo:room'); setUrlCode(null); setCode(null); setState(null) }

  const partner = state?.order.find(id => id !== myId) ?? null
  const value = useMemo<Duo>(
    () => ({ me: myId, name, setName, code, mode: MODE, online, state, isHost, partner, create, join, leave, act, send, listen, chat, say }),
    [name, code, online, state, isHost, partner, act, send, listen, chat, say],
  )
  return <DuoContext.Provider value={value}>{children}</DuoContext.Provider>
}
