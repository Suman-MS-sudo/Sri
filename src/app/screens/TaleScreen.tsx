import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ArrowLeft, ArrowRight, Headphones, Images, RotateCcw } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { HER, TALE, type TaleChat } from '../../content/love'
import { ScreenBackground, TAB_BAR_H, type Tab } from '../ui'

const EASE = [0.16, 1, 0.3, 1] as const
const SCENES = TALE.parts.length + 1 // a cover, then one scene per part

/** Our story as a walkthrough: swipe or tap Next to go from scene to scene. */
export default function TaleScreen({ onGo }: { onGo: (t: Tab) => void }) {
  const [[i, dir], setScene] = useState<[number, number]>([0, 1])
  const go = (d: number) => {
    const n = i + d
    if (n >= 0 && n < SCENES) setScene([n, d])
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70 || info.velocity.x < -450) go(1)
    else if (info.offset.x > 70 || info.velocity.x > 450) go(-1)
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ScreenBackground glow="rgba(237, 180, 11, .09)" />

      <AnimatePresence custom={dir} initial={false} mode="popLayout">
        <motion.div
          key={i}
          custom={dir}
          className="no-scrollbar absolute inset-0 z-10 touch-pan-y overflow-y-auto px-5 pt-[92px]"
          style={{ paddingBottom: TAB_BAR_H + 96 }}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? 90 : -90, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d > 0 ? -90 : 90, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: EASE }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          dragDirectionLock
          onDragEnd={onDragEnd}
        >
          {i === 0 ? <Cover onStart={() => go(1)} /> : <Part n={i - 1} onGo={onGo} />}
        </motion.div>
      </AnimatePresence>

      {/* progress and the buttons */}
      <div className="absolute inset-x-0 z-20 px-5 pb-3 pt-6" style={{ bottom: TAB_BAR_H, background: 'linear-gradient(to top, #0a0e1c 55%, transparent)' }}>
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: SCENES }, (_, k) => (
            <button key={k} type="button" onClick={() => setScene([k, k > i ? 1 : -1])} aria-label={k === 0 ? 'Cover' : `Part ${k}`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span className="block h-full rounded-full bg-app-gold" animate={{ width: k <= i ? '100%' : '0%' }} transition={{ duration: 0.5 }} />
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => go(-1)} disabled={i === 0} className="glass flex h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium disabled:opacity-0">
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-[12px] text-white/45">{i === 0 ? 'swipe to begin' : `${i} / ${SCENES - 1}`}</span>
          {i < SCENES - 1 ? (
            <button type="button" onClick={() => go(1)} className="flex h-11 items-center gap-1.5 rounded-full bg-app-gold px-5 text-[14px] font-semibold text-black active:scale-95">
              {i === 0 ? 'Begin' : 'Next'} <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={() => setScene([0, -1])} className="glass flex h-11 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium">
              <RotateCcw size={15} /> Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------- pieces ----------------

/** Shows a growing count of steps over time: step k appears at times[k] ms after mount. */
function useSteps(times: number[]) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const ts = times.map((t, k) => setTimeout(() => setN(k + 1), t))
    return () => ts.forEach(clearTimeout)
  }, [])
  return n
}

function Stage({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`relative h-[230px] overflow-hidden rounded-[26px] ring-1 ring-white/10 ${className}`}
      style={style}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function Text({ lines, delay = 0.5 }: { lines: string[]; delay?: number }) {
  return (
    <div className="mt-5 flex flex-col gap-3">
      {lines.map((l, k) => (
        <motion.p
          key={k}
          className="text-[15.5px] leading-[1.65] text-white/80"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + k * 0.45, duration: 0.7, ease: EASE }}
        >
          {l}
        </motion.p>
      ))}
    </div>
  )
}

/** Replays a conversation, with "typing…" before each message. */
function Chat({ lines, start = 0, onDone, title }: { lines: TaleChat[]; start?: number; onDone?: () => void; title?: string }) {
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState<TaleChat['from'] | null>(null)
  const [run, setRun] = useState(0)
  useEffect(() => {
    setShown(0)
    const ts: ReturnType<typeof setTimeout>[] = []
    let t = start
    lines.forEach((l, k) => {
      ts.push(setTimeout(() => setTyping(l.from), t))
      t += 900 + Math.min(1400, l.text.length * 18)
      ts.push(setTimeout(() => { setTyping(null); setShown(k + 1) }, t))
      t += 500
    })
    ts.push(setTimeout(() => onDone?.(), t))
    return () => ts.forEach(clearTimeout)
  }, [run])
  return (
    <div className="glass mt-5 rounded-[22px] p-3">
      <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
        <img src={HER.face} alt="" className="h-7 w-7 rounded-full" />
        <span className="text-[13px] font-semibold">Sami</span>
        {title && <span className="ml-auto text-[11px] text-white/45">{title}</span>}
      </div>
      <div className="flex min-h-[56px] flex-col gap-1.5">
        {lines.slice(0, shown).map((l, k) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`max-w-[84%] rounded-2xl px-3 py-2 text-[14px] leading-snug ${l.from === 'me' ? 'self-end rounded-br-md bg-app-gold font-medium text-black' : 'self-start rounded-bl-md bg-white/12 text-white'}`}
          >
            {l.text}
          </motion.div>
        ))}
        {typing && (
          <div className={`flex gap-1 rounded-2xl px-3 py-2.5 ${typing === 'me' ? 'self-end bg-app-gold/30' : 'self-start bg-white/10'}`}>
            {[0, 1, 2].map(d => (
              <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-white/70" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }} />
            ))}
          </div>
        )}
      </div>
      {shown === lines.length && (
        <button type="button" onClick={() => setRun(r => r + 1)} className="mt-2 flex items-center gap-1 text-[11px] text-white/40">
          <RotateCcw size={11} /> replay
        </button>
      )}
    </div>
  )
}

function Heading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-4">
      <p className="text-[13px] font-semibold tracking-[0.14em] text-app-gold">{kicker.toUpperCase()}</p>
      <h2 className="mt-1 text-[34px] font-normal leading-[0.98] tracking-[-0.05em] text-white">{title}</h2>
    </motion.div>
  )
}

function Big({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.p
      className="mt-5 font-hand text-[30px] leading-[1.1] text-app-gold"
      initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.9, ease: EASE }}
    >
      {children}
    </motion.p>
  )
}

// ---------------- scenes ----------------

function Cover({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col">
      <Stage style={{ background: 'radial-gradient(80% 70% at 50% 60%, rgba(237,180,11,.18), transparent 70%)' }}>
        {/* two friends, eight years, drawing closer */}
        <motion.div className="absolute top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-full bg-app-gold text-[30px] font-semibold text-black shadow-[0_0_30px_rgba(237,180,11,.5)]"
          initial={{ left: '4%' }} animate={{ left: '20%' }} transition={{ delay: 0.4, duration: 1.6, ease: EASE }}>
          me
        </motion.div>
        <motion.img src={HER.face} alt="Sami" className="absolute top-1/2 h-24 w-24 -translate-y-1/2 rounded-full ring-2 ring-[#FF5C8A] shadow-[0_0_30px_rgba(255,92,138,.45)]"
          initial={{ right: '4%' }} animate={{ right: '20%' }} transition={{ delay: 0.4, duration: 1.6, ease: EASE }} />
        <motion.span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[38px]"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4, 1], opacity: 1 }} transition={{ delay: 1.9, duration: 0.7 }}>
          ❤️
        </motion.span>
        <span className="absolute inset-x-0 bottom-3 text-center text-[11px] uppercase tracking-[0.3em] text-white/45">TCS · 8 years → forever</span>
      </Stage>
      <motion.p className="mt-6 text-[13px] font-semibold tracking-[0.14em] text-app-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        OUR STORY
      </motion.p>
      <motion.h2 className="mt-1 text-[48px] font-normal leading-[0.92] tracking-[-0.06em] text-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }}>
        Her Heart
        <br />
        <span className="text-app-gold">Knew First</span>
      </motion.h2>
      <motion.p className="mt-4 text-[15px] leading-relaxed text-white/65" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
        She held a secret for over a year. The secret was me. Eight years of friendship, a train, a song, and three little words.
      </motion.p>
      <motion.button type="button" onClick={onStart} className="mt-6 self-start rounded-2xl bg-app-gold px-6 py-3.5 text-[15px] font-semibold text-black" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
        Begin our story →
      </motion.button>
    </div>
  )
}

function Part({ n, onGo }: { n: number; onGo: (t: Tab) => void }) {
  const p = TALE.parts[n]
  return (
    <div>
      <Heading kicker={p.kicker} title={p.title} />
      {n === 0 && <FriendshipScene />}
      {n === 1 && <StationScene />}
      {n === 2 && <TrainScene />}
      {n === 3 && <BridgeScene />}
      {n === 4 && <SofaScene onGo={onGo} />}
    </div>
  )
}

/** Part 1: two desks at TCS, little chats flying between them. */
function FriendshipScene() {
  const p = TALE.parts[0]
  const notes = ['😂', 'chai? ☕', 'gm ☀️', 'reached? 🙈', '😂😂', 'gn 🌙']
  return (
    <>
      <Stage style={{ background: 'linear-gradient(180deg, #121a33 0%, #0c1022 100%)' }}>
        <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.25em] text-white/70">TCS</span>
        <span className="absolute bottom-8 left-5 text-[56px]">💻</span>
        <span className="absolute bottom-8 right-5 text-[56px]">💻</span>
        <span className="absolute bottom-3 left-8 text-[11px] text-white/50">me</span>
        <span className="absolute bottom-3 right-7 text-[11px] text-white/50">Sami</span>
        {notes.map((t, k) => {
          const ltr = k % 2 === 0
          return (
            <motion.span
              key={k}
              className={`absolute top-[46%] whitespace-nowrap rounded-2xl px-2.5 py-1 text-[13px] ${ltr ? 'bg-app-gold text-black' : 'bg-white/15 text-white'}`}
              initial={{ left: ltr ? '14%' : '70%', opacity: 0, y: 0 }}
              animate={{ left: ltr ? ['14%', '62%'] : ['70%', '18%'], opacity: [0, 1, 1, 0], y: [0, -26 - (k % 3) * 14, -40 - (k % 3) * 14] }}
              transition={{ duration: 2.6, delay: k * 0.9, repeat: Infinity, repeatDelay: notes.length * 0.9 - 2.6 + 0.4, ease: 'easeInOut' }}
            >
              {t}
            </motion.span>
          )
        })}
        <motion.span className="absolute right-4 top-4 text-[11px] text-white/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          8 years of chats 💬
        </motion.span>
      </Stage>
      <Text lines={p.text} />
    </>
  )
}

/** Part 2: the station at 6 PM, a train pulling in, and the texts. */
function StationScene() {
  const p = TALE.parts[1]
  return (
    <>
      <Stage style={{ background: 'linear-gradient(180deg, #2a1a3a 0%, #1a1530 45%, #0d1020 100%)' }}>
        <span className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">Mon · 4 Nov 2024</span>
        <span className="absolute right-4 top-3 text-[30px] font-semibold tracking-[-0.04em] text-app-gold">6:00 PM</span>
        <span className="absolute left-4 top-14 text-[12px] text-white/55">Chennai 🚉 → Hyderabad</span>
        <div className="absolute inset-x-0 bottom-10 h-[3px] bg-white/20" />
        <motion.span className="absolute bottom-10 text-[64px] leading-none" initial={{ left: '110%' }} animate={{ left: '18%' }} transition={{ delay: 0.4, duration: 2.4, ease: [0.2, 0.8, 0.3, 1] }}>
          🚆
        </motion.span>
        <span className="absolute bottom-3 left-4 text-[11px] text-white/45">platform · a heavy bag · phone in hand</span>
      </Stage>
      <Text lines={p.text} />
      <Chat lines={p.chat!} start={2400} title="4 Nov 2024 · evening" />
    </>
  )
}

/** Part 3: the train door at night, Narumugaye playing, then lightning. */
function TrainScene() {
  const p = TALE.parts[2]
  const step = useSteps([3600, 4300])
  return (
    <>
      <Stage style={{ background: 'linear-gradient(180deg, #050816 0%, #0b1230 60%, #10183a 100%)' }}>
        {/* the night rushing past the door */}
        {Array.from({ length: 9 }, (_, k) => (
          <motion.span
            key={k}
            className="absolute h-[3px] rounded-full bg-amber-200/70"
            style={{ top: `${18 + k * 9}%`, width: 30 + (k % 3) * 40 }}
            initial={{ left: '110%' }}
            animate={{ left: '-40%' }}
            transition={{ duration: 0.9 + (k % 4) * 0.35, repeat: Infinity, delay: k * 0.17, ease: 'linear' }}
          />
        ))}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur">
          <Headphones size={15} className="text-app-gold" />
          <span className="text-[12px] text-white/85">{p.song}</span>
          <span className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2, 3].map(b => (
              <motion.span key={b} className="w-[3px] rounded-full bg-app-gold" animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }} transition={{ duration: 0.9, repeat: Infinity, delay: b * 0.12 }} />
            ))}
          </span>
        </div>
        {/* the moment it all clicks */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0.2, 0.7, 0] }} transition={{ duration: 0.9 }} />
          )}
        </AnimatePresence>
        {step >= 2 && (
          <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE }}>
            <span className="text-[54px] font-semibold tracking-[-0.06em] text-app-gold drop-shadow-[0_0_24px_rgba(237,180,11,.6)]">It was me.</span>
          </motion.div>
        )}
      </Stage>
      <Chat lines={p.chat!} start={400} title="her reply" />
      <Text lines={p.text} delay={2.2} />
      {step >= 2 && <Big delay={0.2}>{p.big}</Big>}
      {step >= 2 && (
        <motion.p className="mt-2 text-[14px] text-white/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {p.after}
        </motion.p>
      )}
    </>
  )
}

/** Part 4: floating across the footbridge, then the bike ride and happy tears. */
function BridgeScene() {
  const p = TALE.parts[3]
  return (
    <>
      <Stage style={{ background: 'linear-gradient(180deg, #0a0f26 0%, #121a3a 100%)' }}>
        {/* stars */}
        {Array.from({ length: 14 }, (_, k) => (
          <motion.span key={k} className="absolute h-[2px] w-[2px] rounded-full bg-white" style={{ left: `${(k * 37) % 100}%`, top: `${(k * 23) % 45}%` }} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2 + (k % 3), repeat: Infinity, delay: k * 0.2 }} />
        ))}
        {/* the footbridge */}
        <svg viewBox="0 0 360 230" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 150 L60 150 L60 95 L300 95 L300 150 L360 150" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="4" />
          <path d="M60 95 L300 95" stroke="rgba(237,180,11,.5)" strokeWidth="2" strokeDasharray="6 6" />
          {[90, 140, 190, 240].map(x => <line key={x} x1={x} y1="95" x2={x} y2="150" stroke="rgba(255,255,255,.12)" strokeWidth="2" />)}
          <line x1="0" y1="200" x2="360" y2="200" stroke="rgba(255,255,255,.15)" strokeWidth="2" />
        </svg>
        {/* me, light as air */}
        <motion.span
          className="absolute text-[40px] leading-none"
          style={{ top: 38 }}
          initial={{ left: '12%' }}
          animate={{ left: ['12%', '74%'], y: [0, -14, -4, -18, -6, -14, 0] }}
          transition={{ left: { duration: 4.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }, y: { duration: 4.2, repeat: Infinity, repeatDelay: 1 } }}
        >
          🧑‍💼
        </motion.span>
        <motion.span className="absolute text-[18px]" style={{ top: 24 }} initial={{ left: '18%', opacity: 0 }} animate={{ left: ['18%', '80%'], opacity: [0, 1, 1, 0] }} transition={{ duration: 4.2, repeat: Infinity, repeatDelay: 1 }}>
          ✨
        </motion.span>
        <span className="absolute left-4 top-3 text-[11px] text-white/55">🎒 2 laptops · weight: 0</span>
        {/* the bike ride below */}
        <motion.span className="absolute bottom-[34px] text-[30px] leading-none" initial={{ left: '-15%' }} animate={{ left: '110%' }} transition={{ duration: 3.4, repeat: Infinity, delay: 1.2, ease: 'linear' }}>
          🛵💨
        </motion.span>
        {[0, 1, 2].map(k => (
          <motion.span key={k} className="absolute bottom-3 text-[14px]" style={{ left: `${30 + k * 22}%` }} animate={{ y: [0, 10], opacity: [0, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity, delay: 1.5 + k * 0.4 }}>
            💧
          </motion.span>
        ))}
      </Stage>
      <Text lines={p.text} />
      <Big delay={1.8}>“{p.big}”</Big>
    </>
  )
}

/** Part 5: the sofa in Hyderabad, the message, and "I AM IN". */
function SofaScene({ onGo }: { onGo: (t: Tab) => void }) {
  const p = TALE.parts[4]
  const [done, setDone] = useState(false)
  const hearts = Array.from({ length: 16 }, (_, k) => ({ x: (k * 53) % 100, d: (k % 5) * 0.12, s: 18 + (k % 4) * 6 }))
  return (
    <>
      <Stage style={{ background: 'radial-gradient(70% 70% at 50% 75%, rgba(225,6,0,.18), transparent 70%), linear-gradient(180deg, #14122a 0%, #0c0f20 100%)' }}>
        <span className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">Fri · 8 Nov 2024 · Hyderabad</span>
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[80px] leading-none">🛋️</span>
        <motion.span className="absolute bottom-[78px] left-[54%] text-[30px]" animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 1.6, repeat: Infinity }}>
          📱
        </motion.span>
        <AnimatePresence>
          {done && (
            <>
              <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 160 }}>
                <span className="rounded-2xl bg-black/40 px-4 py-2 text-[46px] font-bold tracking-[-0.05em] text-app-gold drop-shadow-[0_0_24px_rgba(237,180,11,.7)] backdrop-blur-sm">I AM IN.</span>
              </motion.div>
              {hearts.map((h, k) => (
                <motion.span key={k} className="absolute bottom-0" style={{ left: `${h.x}%`, fontSize: h.s }} initial={{ y: 20, opacity: 0 }} animate={{ y: -260, opacity: [0, 1, 1, 0] }} transition={{ duration: 2.4, delay: h.d, repeat: Infinity, repeatDelay: 0.8 }}>
                  ❤️
                </motion.span>
              ))}
            </>
          )}
        </AnimatePresence>
      </Stage>
      <Text lines={p.text} />
      <Chat lines={p.chat!} start={2200} title="8 Nov · out of nowhere" onDone={() => setDone(true)} />
      {done && (
        <>
          <Big delay={0.3}>{p.after}</Big>
          <motion.button
            type="button"
            onClick={() => onGo('gallery')}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-app-gold px-6 py-3.5 text-[15px] font-semibold text-black"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Images size={17} /> See our photos
          </motion.button>
        </>
      )}
    </>
  )
}
