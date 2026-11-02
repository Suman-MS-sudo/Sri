import { motion } from 'framer-motion'
import { Check, Copy, Crown, Heart, LogOut, RotateCcw, Share2, Wifi, WifiOff } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { inviteLink, useDuo, type GameId, type Result } from './DuoContext'
import LovePong from './games/LovePong'
import HeartCatch from './games/HeartCatch'
import TugOfLove from './games/TugOfLove'
import { FourHearts, LoveXO, MemoryOfUs, RockPaperLove } from './games/TurnGames'
import { usePrimary } from '../app/LoveContext'

const gold = 'bg-app-gold text-black'

function Big({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-semibold leading-[0.8] tracking-[-0.07em] ${className}`}>{children}</p>
}
function Primary({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${gold}`}>
      {children}
    </button>
  )
}
function Ghost({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-medium text-white/85 transition active:scale-[0.98]">
      {children}
    </button>
  )
}

/** The whole two-player game, from naming yourself to the final result. */
export default function DuoGame() {
  const d = useDuo()
  if (!d.name) return <NameStep />
  if (!d.code) return <RoomStep />
  if (!d.state) return <Connecting />
  if (!d.partner) return <Waiting />
  if (d.state.phase === 'play') return <Play />
  if (d.state.phase === 'end') return <End />
  return <Lobby />
}

const MODE_LABEL = { live: 'Live: play from anywhere', wifi: 'Home Wi-Fi: devices on this network', tabs: 'Test mode: two tabs of this browser' }

function ConnectionBadge() {
  const { mode } = useDuo()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${mode === 'tabs' ? 'bg-white/10 text-white/55' : 'bg-emerald-500/15 text-emerald-300'}`}>
      {mode === 'tabs' ? <WifiOff size={12} /> : <Wifi size={12} />}
      {MODE_LABEL[mode]}
    </span>
  )
}

/** Copy text even where the clipboard API is missing (plain http on a local network). */
async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch { /* fall back */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'; ta.style.opacity = '0'
  document.body.appendChild(ta); ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  return ok
}

function NameStep() {
  const { setName } = useDuo()
  const [v, setV] = useState('')
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-white/70">First, what's your name? Your love will see it during the game.</p>
      <input
        value={v}
        onChange={e => setV(e.target.value.slice(0, 16))}
        onKeyDown={e => e.key === 'Enter' && v.trim() && setName(v.trim())}
        placeholder="Your name"
        className="glass h-14 rounded-2xl px-4 text-[17px] text-white outline-none placeholder:text-white/35 focus:border-app-gold/60"
      />
      <Primary onClick={() => setName(v.trim())} disabled={!v.trim()}>Continue</Primary>
    </div>
  )
}

function RoomStep() {
  const { create, join, name } = useDuo()
  const [code, setCode] = useState('')
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-white/70">
        Hi {name}. One of you creates a room and sends the invite; the other joins with the link or the code.
      </p>
      <Primary onClick={create}>
        <Heart size={18} className="fill-black" /> Create a room
      </Primary>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && code.length >= 4 && join(code)}
          placeholder="CODE"
          className="glass h-14 w-full rounded-2xl px-4 text-center text-[22px] font-semibold tracking-[0.3em] text-white outline-none placeholder:text-white/25"
        />
        <button type="button" onClick={() => join(code)} disabled={code.length < 4} className="glass h-14 shrink-0 rounded-2xl px-5 text-[15px] font-semibold text-white disabled:opacity-40">
          Join
        </button>
      </div>
      <ConnectionBadge />
    </div>
  )
}

function Connecting() {
  const { code, leave } = useDuo()
  return (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
        <Heart size={44} className="fill-app-red text-app-red" />
      </motion.div>
      <p className="text-[15px] text-white/70">Finding room {code}…</p>
      <p className="text-[13px] text-white/45">The person who created it needs to have the app open.</p>
      <button type="button" onClick={leave} className="text-[13px] text-white/50 underline">Use a different code</button>
    </div>
  )
}

function Waiting() {
  const { code, leave } = useDuo()
  const [copied, setCopied] = useState(false)
  const link = inviteLink(code!)
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Play with me ❤️', text: 'Join my room and play Love Match with me', url: link }); return } catch { /* cancelled */ }
    }
    await copyText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[13px] text-white/55">Room code</p>
        <Big className="text-[96px] text-app-gold">{code}</Big>
      </div>
      <div className="glass flex items-center gap-3 rounded-2xl p-4">
        <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <Heart size={26} className="fill-app-red text-app-red" />
        </motion.div>
        <p className="text-[14px] leading-snug text-white/75">Waiting for your love to join. Send the invite, or tell her the code.</p>
      </div>
      <Primary onClick={share}>
        {copied ? <Check size={18} /> : <Share2 size={18} />} {copied ? 'Link copied' : 'Share invite'}
      </Primary>
      <Ghost onClick={() => copyText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })}>
        <Copy size={16} /> Copy link
      </Ghost>
      <div className="flex items-center justify-between">
        <ConnectionBadge />
        <button type="button" onClick={leave} className="flex items-center gap-1 text-[12px] text-white/45">
          <LogOut size={13} /> Leave
        </button>
      </div>
    </div>
  )
}

function Players() {
  const { state, me, online } = useDuo()
  return (
    <div className="flex gap-2">
      {state!.order.map(id => (
        <div key={id} className="glass flex flex-1 items-center gap-2 rounded-2xl px-3 py-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${online.includes(id) ? 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400' : 'bg-white/25'}`} />
          <span className="truncate text-[14px] font-medium">{state!.players[id]}</span>
          {id === me && <span className="text-[11px] text-white/40">you</span>}
        </div>
      ))}
    </div>
  )
}

export const GAMES: { id: GameId; emoji: string; name: string; text: string; kind: 'action' | 'classic' }[] = [
  { id: 'xo', emoji: '❌', name: 'Love XO', text: 'Tic-tac-toe. You are X, she is O. Three in a row wins.', kind: 'classic' },
  { id: 'c4', emoji: '💗', name: 'Four Hearts', text: 'Drop hearts into the board. Four in a line wins.', kind: 'classic' },
  { id: 'memory', emoji: '🖼️', name: 'Memory of Us', text: 'Take turns flipping our photos. Find the most pairs.', kind: 'classic' },
  { id: 'rps', emoji: '✊', name: 'Rock Paper Love', text: 'Choose in secret, reveal together. First to 3. Loser owes a kiss.', kind: 'classic' },
  { id: 'pong', emoji: '💘', name: 'Love Pong', text: 'Bounce a heart past each other. Slide your finger to move. First to 5.', kind: 'action' },
  { id: 'catch', emoji: '💝', name: 'Heart Catch', text: 'Hearts rain down: catch more than her in 45 seconds. Gold +3, broken −2.', kind: 'action' },
  { id: 'tug', emoji: '💞', name: 'Tug of Love', text: 'Tap as fast as you can to pull the heart to your side.', kind: 'action' },
]

function Tally() {
  const { state, me } = useDuo()
  const s = state!
  if (!Object.keys(s.wins).length) return null
  return (
    <p className="text-center text-[13px] text-white/55">
      Wins so far:{' '}
      {s.order.map((id, i) => (
        <span key={id}>
          {i > 0 && ' · '}
          <span className={id === me ? 'text-app-gold' : 'text-[#FF5C8A]'}>
            {id === me ? 'You' : s.players[id]} {s.wins[id] ?? 0}
          </span>
        </span>
      ))}
    </p>
  )
}

function Lobby() {
  const { act, leave } = useDuo()
  return (
    <div className="flex flex-col gap-3">
      <Players />
      <Tally />
      <p className="mt-1 text-[13px] text-white/55">Pick a game. Either of you can start it, and it starts on both phones.</p>
      {(['action', 'classic'] as const).map(kind => (
        <div key={kind} className="flex flex-col gap-2">
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-app-gold">{kind === 'action' ? 'Action' : 'Classics'}</p>
          {GAMES.filter(g => g.kind === kind).map(g => (
            <button key={g.id} type="button" onClick={() => act({ type: 'start', game: g.id })} className="glass flex items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.98]">
              <span className="w-10 text-center text-[30px]" aria-hidden="true">{g.emoji}</span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[17px] font-semibold tracking-[-0.03em]">{g.name}</span>
                <span className="text-[12.5px] leading-snug text-white/60">{g.text}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
      <button type="button" onClick={leave} className="mt-1 flex items-center gap-1 self-end text-[12px] text-white/45">
        <LogOut size={13} /> Leave room
      </button>
    </div>
  )
}

function Play() {
  const { state, isHost, act, partner, online } = useDuo()
  const s = state!
  // only the room's creator decides the result; the other phone just plays
  const onEnd = (result: Result) => { if (isHost) act({ type: 'end', result }) }
  const game = GAMES.find(g => g.id === s.game)!
  if (!usePrimary()) return <p className="glass rounded-2xl p-4 text-[14px] text-white/70">{game.emoji} {game.name} is on. Play it in the middle phone.</p>
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-[-0.02em]">
          {game.emoji} {game.name}
        </span>
        <button type="button" onClick={() => act({ type: 'lobby' })} className="text-[12px] text-white/50">
          Quit
        </button>
      </div>
      {s.game === 'pong' && <LovePong key={s.run} onEnd={onEnd} />}
      {s.game === 'catch' && <HeartCatch key={s.run} onEnd={onEnd} />}
      {s.game === 'tug' && <TugOfLove key={s.run} onEnd={onEnd} />}
      {s.game === 'xo' && <LoveXO key={s.run} />}
      {s.game === 'c4' && <FourHearts key={s.run} />}
      {s.game === 'memory' && <MemoryOfUs key={s.run} />}
      {s.game === 'rps' && <RockPaperLove key={s.run} />}
      {!online.includes(partner!) && <p className="text-center text-[12px] text-app-red">{s.players[partner!]} seems to be offline…</p>}
    </div>
  )
}

function End() {
  const { state, act, me } = useDuo()
  const s = state!
  const r = s.result!
  const game = GAMES.find(g => g.id === s.game)!
  const iWon = r.winner === me
  const headline = r.winner === null ? "It's a tie! 💞" : iWon ? 'You win! 💖' : `${s.players[r.winner]} wins! 👑`
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <p className="text-[13px] text-white/55">
        {game.emoji} {game.name}
      </p>
      <p className="text-[44px] font-semibold leading-[0.9] tracking-[-0.05em]">{headline}</p>
      {s.game === 'xo' && <LoveXO readOnly />}
      {s.game === 'c4' && <FourHearts readOnly />}
      {s.game === 'rps' && <RockPaperLove readOnly />}
      <div className="flex gap-3">
        {s.order.map(id => (
          <div key={id} className={`glass relative flex-1 rounded-2xl p-4 ${r.winner === id ? 'ring-1 ring-app-gold/70' : ''}`}>
            {r.winner === id && <Crown size={18} className="absolute right-3 top-3 text-app-gold" />}
            <p className="truncate text-[13px] text-white/60">{id === me ? 'You' : s.players[id]}</p>
            <Big className={`mt-2 text-[64px] ${id === me ? 'text-app-gold' : 'text-[#FF5C8A]'}`}>{r.scores[id] ?? 0}</Big>
            {(s.game === 'tug' || s.game === 'memory') && <p className="mt-1 text-[11px] text-white/40">{s.game === 'tug' ? 'taps' : 'pairs'}</p>}
          </div>
        ))}
      </div>
      <Tally />
      <Primary onClick={() => act({ type: 'start', game: s.game! })}>
        <RotateCcw size={17} /> Rematch
      </Primary>
      <Ghost onClick={() => act({ type: 'lobby' })}>Choose another game</Ghost>
    </motion.div>
  )
}
