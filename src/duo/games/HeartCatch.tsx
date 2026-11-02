import { useEffect, useRef } from 'react'
import { useDuo } from '../DuoContext'
import { clamp, COUNTDOWN_MS, countdown, field, GOLD, H, heart, PINK, text, useCanvas, useFrame, useTicker, W, worldX } from '../arcade'
import type { GameProps } from './LovePong'

const BW = 74, BY = H - 42, SECONDS = 45
type Kind = 0 | 1 | 2 // heart +1, golden +3, broken -2
const VALUE = [1, 3, -2]
const COLOR = ['#ff3b5c', GOLD, '#7d8597']
type Drop = { id: number; x: number; y: number; v: number; k: Kind }
type Pop = { x: number; y: number; label: string; color: string; t: number }

/** Hearts rain down; both baskets race to catch them. Most points in 45 seconds wins. */
export default function HeartCatch({ onEnd }: GameProps) {
  const { isHost, me, partner, state, send, listen } = useDuo()
  const names = state!.players
  const { canvas, ctx } = useCanvas()
  const g = useRef({
    drops: [] as Drop[],
    pops: [] as Pop[],
    events: [] as [number, number, Kind, number][], // x, y, kind, catcher (0 host, 1 guest), sent with the next update
    mine: W * 0.35,
    theirs: W * 0.65,
    theirsShown: W * 0.65,
    score: [0, 0] as [number, number], // [host, guest]
    cdEnd: performance.now() + COUNTDOWN_MS,
    endAt: 0,
    spawnIn: 0,
    nextId: 1,
    over: false,
    keys: { left: false, right: false },
  })

  useEffect(() => {
    if (isHost) return listen('catch-in', m => { g.current.theirs = Number(m.x) })
    return listen('catch', m => {
      const s = g.current
      s.drops = (m.h as number[][]).map(([id, x, y, v, k]) => ({ id, x, y, v, k: k as Kind }))
      s.theirs = Number(m.p)
      s.score = m.s as [number, number]
      s.cdEnd = performance.now() + Number(m.cd)
      s.endAt = performance.now() + Number(m.t)
      for (const [x, y, k, who] of m.e as [number, number, Kind, number][]) addPop(x, y, k, who === 1)
    })
  }, [isHost, listen])

  useEffect(() => {
    const k = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') g.current.keys.left = down
      if (e.key === 'ArrowRight') g.current.keys.right = down
    }
    const d = k(true), u = k(false)
    addEventListener('keydown', d); addEventListener('keyup', u)
    return () => { removeEventListener('keydown', d); removeEventListener('keyup', u) }
  }, [])

  const addPop = (x: number, y: number, k: Kind, byGuest: boolean) => {
    const mineCaught = byGuest !== isHost
    g.current.pops.push({ x, y, label: (VALUE[k] > 0 ? '+' : '') + VALUE[k], color: mineCaught ? GOLD : PINK, t: 1 })
  }

  useTicker(20, () => {
    const s = g.current
    if (isHost) {
      send('catch', {
        h: s.drops.map(d => [d.id, Math.round(d.x), Math.round(d.y), Math.round(d.v), d.k]),
        p: Math.round(s.mine),
        s: s.score,
        cd: Math.round(s.cdEnd - performance.now()),
        t: Math.round((s.endAt || s.cdEnd + SECONDS * 1000) - performance.now()),
        e: s.events,
      })
      s.events = []
    } else send('catch-in', { x: Math.round(s.mine) })
  })

  useFrame((dt, now) => {
    const s = g.current, c = ctx.current
    const dir = (s.keys.right ? 1 : 0) - (s.keys.left ? 1 : 0)
    if (dir) s.mine = clamp(s.mine + dir * 420 * dt, BW / 2, W - BW / 2)
    s.theirsShown += (s.theirs - s.theirsShown) * Math.min(1, dt * 18)

    if (isHost && !s.over && now >= s.cdEnd) {
      if (!s.endAt) s.endAt = s.cdEnd + SECONDS * 1000
      const elapsed = 1 - (s.endAt - now) / (SECONDS * 1000)
      s.spawnIn -= dt
      if (s.spawnIn <= 0) {
        const r = Math.random()
        const k: Kind = r < 0.12 ? 1 : r < 0.27 ? 2 : 0
        s.drops.push({ id: s.nextId++, x: 20 + Math.random() * (W - 40), y: -16, v: 130 + Math.random() * 90 + elapsed * 110, k })
        s.spawnIn = 0.5 - elapsed * 0.25
      }
      const baskets: [number, number][] = [[s.mine, 0], [s.theirs, 1]]
      s.drops = s.drops.filter(d => {
        d.y += d.v * dt
        if (d.y > BY - 14 && d.y < BY + 12) {
          const near = baskets.filter(([x]) => Math.abs(d.x - x) < BW / 2 + 6).sort((a, b) => Math.abs(d.x - a[0]) - Math.abs(d.x - b[0]))[0]
          if (near) {
            s.score[near[1]] += VALUE[d.k]
            s.events.push([Math.round(d.x), Math.round(d.y), d.k, near[1]])
            addPop(d.x, d.y, d.k, near[1] === 1)
            return false
          }
        }
        return d.y < H + 20
      })
      if (now >= s.endAt) {
        s.over = true
        const [hs, gs] = s.score
        onEnd({ winner: hs === gs ? null : hs > gs ? me : partner, scores: { [me]: hs, [partner!]: gs } })
      }
    } else if (!isHost) {
      for (const d of s.drops) d.y += d.v * dt // keep falling smoothly between updates
    }
    for (const p of s.pops) { p.t -= dt * 1.4; p.y -= 40 * dt }
    s.pops = s.pops.filter(p => p.t > 0)

    if (!c) return
    field(c, '#140b1f', '#0a0e1c')
    // a few stars
    for (let i = 0; i < 26; i++) {
      c.fillStyle = `rgba(255,255,255,${0.08 + ((i * 37) % 10) / 60})`
      c.fillRect((i * 97) % W, (i * 53) % (H - 80), 2, 2)
    }
    for (const d of s.drops) heart(c, d.x, d.y, d.k === 1 ? 30 : 26, COLOR[d.k], d.k === 1 ? 16 : 8)
    for (const d of s.drops) if (d.k === 2) { c.strokeStyle = '#0a0e1c'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(d.x - 2, d.y - 9); c.lineTo(d.x + 3, d.y - 2); c.lineTo(d.x - 2, d.y + 3); c.lineTo(d.x + 1, d.y + 8); c.stroke() }
    const basket = (x: number, color: string, label: string) => {
      c.save(); c.shadowColor = color; c.shadowBlur = 16; c.fillStyle = color
      c.beginPath(); c.moveTo(x - BW / 2, BY - 8); c.lineTo(x + BW / 2, BY - 8); c.lineTo(x + BW / 2 - 10, BY + 14); c.lineTo(x - BW / 2 + 10, BY + 14); c.closePath(); c.fill(); c.restore()
      text(c, label, x, BY + 26, 12, 'rgba(255,255,255,.7)', 'center', 500)
    }
    basket(s.theirsShown, PINK, names[partner!] ?? '')
    basket(s.mine, GOLD, 'You')
    for (const p of s.pops) { c.globalAlpha = Math.max(0, p.t); text(c, p.label, p.x, p.y - 20, 22, p.color, 'center', 700); c.globalAlpha = 1 }

    const [myScore, theirScore] = isHost ? s.score : [s.score[1], s.score[0]]
    const left = Math.max(0, Math.ceil(((s.endAt || s.cdEnd + SECONDS * 1000) - now) / 1000))
    text(c, String(myScore), 16, 26, 34, GOLD, 'left', 700)
    text(c, 'you', 16, 50, 11, 'rgba(255,255,255,.5)', 'left', 500)
    text(c, String(theirScore), W - 16, 26, 34, PINK, 'right', 700)
    text(c, names[partner!] ?? '', W - 16, 50, 11, 'rgba(255,255,255,.5)', 'right', 500)
    text(c, `${Math.min(SECONDS, left)}s`, W / 2, 26, 22, left <= 10 ? '#ff6b6b' : 'rgba(255,255,255,.8)', 'center', 600)
    countdown(c, s.cdEnd - now)
  })

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    g.current.mine = clamp(worldX(e, e.currentTarget), BW / 2, W - BW / 2)
  }
  return (
    <canvas
      ref={canvas}
      onPointerDown={move}
      onPointerMove={move}
      className="block w-full touch-none select-none rounded-[22px] ring-1 ring-white/10"
      style={{ aspectRatio: `${W} / ${H}` }}
      aria-label="Heart Catch: slide your finger to move your basket"
    />
  )
}
