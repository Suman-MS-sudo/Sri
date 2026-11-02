import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useEffect } from 'react'
import { GALLERY } from '../../content/love'
import { useDuo } from '../DuoContext'
import { C4_COLS, C4_ROWS, RPS_WIN, type C4, type Mem, type P, type Rps, type XO } from '../rules'

const GOLD = '#EDB40B', PINK = '#FF5C8A'

/** Who is who: my seat in the room, the colours, and a move sender. */
function useSeat() {
  const { state, me, partner, act } = useDuo()
  const s = state!
  const mine = s.order.indexOf(me) as P
  const color = (p: P) => (p === mine ? GOLD : PINK)
  const nameOf = (p: P) => (p === mine ? 'You' : s.players[s.order[p]])
  return { s, mine, color, nameOf, partnerName: s.players[partner!], move: (m: Record<string, unknown>) => act({ type: 'move', id: me, move: m }) }
}

function TurnBanner({ turn, extra }: { turn: P; extra?: string }) {
  const { mine, partnerName } = useSeat()
  const my = turn === mine
  return (
    <div className="flex items-center justify-between">
      <motion.span
        key={turn}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-full px-3 py-1 text-[13px] font-semibold ${my ? 'bg-app-gold text-black' : 'bg-[#FF5C8A]/20 text-[#FF8FB0]'}`}
      >
        {my ? 'Your turn' : `${partnerName}'s turn`}
      </motion.span>
      {extra && <span className="text-[12px] text-white/50">{extra}</span>}
    </div>
  )
}

// ---------------- Love XO ----------------
export function LoveXO({ readOnly = false }: { readOnly?: boolean }) {
  const { s, mine, color, move } = useSeat()
  const b = s.board as XO
  const mark = (p: P) => (p === 0 ? 'X' : 'O')
  return (
    <div className="flex flex-col gap-3">
      {!readOnly && <TurnBanner turn={b.turn} extra={`You are ${mark(mine)}`} />}
      <div className="mx-auto grid w-full max-w-[330px] grid-cols-3 gap-2">
        {b.cells.map((c, i) => {
          const win = b.line?.includes(i)
          return (
            <button
              key={i}
              type="button"
              disabled={readOnly || c !== null || b.turn !== mine || !!b.line}
              onClick={() => move({ cell: i })}
              aria-label={c === null ? `Empty square ${i + 1}` : `${mark(c)} on square ${i + 1}`}
              className={`glass flex aspect-square items-center justify-center rounded-2xl transition ${win ? 'ring-2 ring-white/80' : ''} ${c === null && b.turn === mine && !readOnly ? 'hover:bg-white/10 active:scale-95' : ''}`}
            >
              {c !== null && (
                <motion.span
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 300 }}
                  className="text-[64px] font-bold leading-none"
                  style={{ color: color(c), textShadow: `0 0 ${win ? 26 : 14}px ${color(c)}` }}
                >
                  {mark(c)}
                </motion.span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Four Hearts (Connect Four) ----------------
export function FourHearts({ readOnly = false }: { readOnly?: boolean }) {
  const { s, mine, color, move } = useSeat()
  const b = s.board as C4
  const myTurn = b.turn === mine && !b.line && !readOnly
  return (
    <div className="flex flex-col gap-3">
      {!readOnly && <TurnBanner turn={b.turn} extra="Four in a row wins" />}
      <div className="glass mx-auto grid w-full max-w-[350px] gap-1 rounded-2xl p-2" style={{ gridTemplateColumns: `repeat(${C4_COLS}, 1fr)` }}>
        {b.cols.map((col, c) => (
          <button
            key={c}
            type="button"
            disabled={!myTurn || col.length >= C4_ROWS}
            onClick={() => move({ col: c })}
            aria-label={`Drop in column ${c + 1}`}
            className={`flex flex-col-reverse gap-1 rounded-xl p-0.5 transition ${myTurn && col.length < C4_ROWS ? 'hover:bg-white/10' : ''}`}
          >
            {Array.from({ length: C4_ROWS }, (_, r) => {
              const p = col[r]
              const win = b.line?.some(([x, y]) => x === c && y === r)
              return (
                <span key={r} className="relative flex aspect-square w-full items-center justify-center rounded-full bg-black/40">
                  {p !== undefined && (
                    <motion.span
                      initial={{ y: -(C4_ROWS - r) * 44, opacity: 0.6 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 16, stiffness: 260 }}
                      className={`flex h-full w-full items-center justify-center rounded-full ${win ? 'ring-2 ring-white' : ''}`}
                      style={{ background: color(p), boxShadow: `0 0 ${win ? 16 : 8}px ${color(p)}` }}
                    >
                      <Heart size={14} className="fill-white/70 text-white/70" />
                    </motion.span>
                  )}
                </span>
              )
            })}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------- Memory of Us ----------------
export function MemoryOfUs({ readOnly = false }: { readOnly?: boolean }) {
  const { s, mine, color, nameOf, move } = useSeat()
  const b = s.board as Mem
  const missShown = b.open.length === 2
  // after a miss, turn the two cards back over (any phone may ask; the rules accept it once)
  useEffect(() => {
    if (!missShown || readOnly) return
    const t = setTimeout(() => move({ hide: true }), 1200)
    return () => clearTimeout(t)
  }, [missShown, readOnly, b.open.join()])
  const myTurn = b.turn === mine && !missShown && !readOnly
  return (
    <div className="flex flex-col gap-3">
      {!readOnly && <TurnBanner turn={b.turn} extra={`${nameOf(0)} ${b.pairs[0]} · ${nameOf(1)} ${b.pairs[1]}`} />}
      <div className="mx-auto grid w-full max-w-[350px] grid-cols-4 gap-2">
        {b.cards.map((photo, i) => {
          const faceUp = b.owner[i] !== null || b.open.includes(i) || readOnly
          const owner = b.owner[i]
          return (
            <button
              key={i}
              type="button"
              disabled={!myTurn || faceUp}
              onClick={() => move({ card: i })}
              aria-label={faceUp ? GALLERY[photo].title.join(' ') : `Card ${i + 1}`}
              className="relative aspect-[3/4] [perspective:600px]"
            >
              <motion.span className="absolute inset-0 [transform-style:preserve-3d]" animate={{ rotateY: faceUp ? 180 : 0 }} transition={{ duration: 0.4 }}>
                <span className="glass absolute inset-0 flex items-center justify-center rounded-xl [backface-visibility:hidden]">
                  <Heart size={22} className="fill-app-gold text-app-gold" />
                </span>
                <span
                  className="absolute inset-0 overflow-hidden rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style={{ boxShadow: owner !== null ? `0 0 0 2px ${color(owner)}, 0 0 12px ${color(owner)}` : undefined }}
                >
                  <img src={GALLERY[photo].thumb} alt="" className="h-full w-full object-cover" />
                </span>
              </motion.span>
            </button>
          )
        })}
      </div>
      {!readOnly && <p className="text-center text-[12px] text-white/45">Find a pair and it's yours, and you go again.</p>}
    </div>
  )
}

// ---------------- Rock Paper Love ----------------
const RPS = [
  { emoji: '✊', name: 'Rock' },
  { emoji: '✋', name: 'Paper' },
  { emoji: '✌️', name: 'Scissors' },
]
export function RockPaperLove({ readOnly = false }: { readOnly?: boolean }) {
  const { s, mine, nameOf, partnerName, move } = useSeat()
  const b = s.board as Rps
  const theirs = (mine === 0 ? 1 : 0) as P
  const myPick = b.picks[mine]
  const theyPicked = b.picks[theirs] !== null
  const last = b.last
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[12px] text-white/50">You</p>
          <p className="text-[56px] font-semibold leading-[0.8] tracking-[-0.06em] text-app-gold">{b.score[mine]}</p>
        </div>
        <p className="pb-1 text-[12px] text-white/45">First to {RPS_WIN} · loser owes a kiss 😘</p>
        <div className="text-right">
          <p className="text-[12px] text-white/50">{partnerName}</p>
          <p className="text-[56px] font-semibold leading-[0.8] tracking-[-0.06em] text-[#FF5C8A]">{b.score[theirs]}</p>
        </div>
      </div>

      {last && (
        <motion.div key={JSON.stringify(last) + b.score.join()} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass flex items-center justify-between rounded-2xl px-5 py-3">
          <span className="text-[44px]">{RPS[last.picks[mine]].emoji}</span>
          <span className="text-center text-[15px] font-semibold">
            {last.w === null ? 'Same! Again' : last.w === mine ? 'You take it! 💛' : `${nameOf(last.w)} takes it! 💗`}
          </span>
          <span className="text-[44px]">{RPS[last.picks[theirs]].emoji}</span>
        </motion.div>
      )}

      {!readOnly && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {RPS.map((r, i) => (
              <button
                key={r.name}
                type="button"
                disabled={myPick !== null}
                onClick={() => move({ pick: i })}
                className={`flex flex-col items-center gap-1 rounded-2xl py-4 transition active:scale-95 ${myPick === i ? 'bg-app-gold text-black' : 'glass'} ${myPick !== null && myPick !== i ? 'opacity-40' : ''}`}
              >
                <span className="text-[40px] leading-none">{r.emoji}</span>
                <span className="text-[12px] font-medium">{r.name}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-[13px] text-white/60">
            {myPick !== null ? (theyPicked ? 'Revealing…' : `Locked in. Waiting for ${partnerName}…`) : theyPicked ? `${partnerName} has chosen. Your move!` : 'Choose in secret'}
          </p>
        </>
      )}
    </div>
  )
}
