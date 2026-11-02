import { useEffect, useRef } from 'react'
import { useDuo } from '../DuoContext'
import { COUNTDOWN_MS, countdown, field, GOLD, H, heart, PINK, text, useCanvas, useFrame, useTicker, W } from '../arcade'
import type { GameProps } from './LovePong'

const PULL = 3.2, LIMIT = 100, SECONDS = 20
const MID = H / 2, SPAN = H / 2 - 70 // how far the heart travels toward each end

/** A heart on a rope between you: tap as fast as you can to pull it to your side. */
export default function TugOfLove({ onEnd }: GameProps) {
  const { isHost, me, partner, state, send, listen } = useDuo()
  const names = state!.players
  const { canvas, ctx } = useCanvas()
  const g = useRef({
    v: 0, // -LIMIT..LIMIT; positive is toward the host
    shown: 0,
    taps: [0, 0] as [number, number], // [host, guest]
    pendingTaps: 0, // the guest's taps not yet sent
    cdEnd: performance.now() + COUNTDOWN_MS,
    endAt: 0,
    over: false,
    bump: 0,
  })

  useEffect(() => {
    if (isHost) {
      return listen('tug-in', m => {
        const s = g.current
        if (s.over || performance.now() < s.cdEnd) return
        const n = Number(m.n)
        s.taps[1] += n
        s.v -= n * PULL
      })
    }
    return listen('tug', m => {
      const s = g.current
      s.v = Number(m.v)
      s.taps = m.taps as [number, number]
      s.cdEnd = performance.now() + Number(m.cd)
      s.endAt = performance.now() + Number(m.t)
    })
  }, [isHost, listen])

  useTicker(20, () => {
    const s = g.current
    if (isHost) send('tug', { v: Math.round(s.v * 10) / 10, taps: s.taps, cd: Math.round(s.cdEnd - performance.now()), t: Math.round((s.endAt || s.cdEnd + SECONDS * 1000) - performance.now()) })
    else if (s.pendingTaps) { send('tug-in', { n: s.pendingTaps }); s.pendingTaps = 0 }
  })

  const tap = () => {
    const s = g.current
    const now = performance.now()
    if (s.over || now < s.cdEnd) return
    s.bump = 1
    if (isHost) { s.taps[0]++; s.v += PULL } else { s.pendingTaps++; s.shown -= PULL * 0.6 } // feel it right away
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap() } }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })

  useFrame((dt, now) => {
    const s = g.current, c = ctx.current
    if (isHost && !s.over && now >= s.cdEnd) {
      if (!s.endAt) s.endAt = s.cdEnd + SECONDS * 1000
      s.v = Math.max(-LIMIT, Math.min(LIMIT, s.v))
      if (Math.abs(s.v) >= LIMIT || now >= s.endAt) {
        s.over = true
        const winner = Math.abs(s.v) < 1 ? null : s.v > 0 ? me : partner
        onEnd({ winner, scores: { [me]: s.taps[0], [partner!]: s.taps[1] } })
      }
    }
    s.shown += (s.v - s.shown) * Math.min(1, dt * 14)
    s.bump = Math.max(0, s.bump - dt * 6)

    if (!c) return
    // my end is the bottom of my screen: positive v pulls toward the host
    const toMe = isHost ? s.shown : -s.shown
    const y = MID + (toMe / LIMIT) * SPAN
    field(c, '#1d0a14', '#0a0e1c')
    // the two ends
    const glowEnd = (top: boolean, color: string, label: string) => {
      const gr = c.createLinearGradient(0, top ? 0 : H, 0, top ? 110 : H - 110)
      gr.addColorStop(0, color + '55'); gr.addColorStop(1, color + '00')
      c.fillStyle = gr; c.fillRect(0, top ? 0 : H - 110, W, 110)
      text(c, label, W / 2, top ? 34 : H - 34, 18, color, 'center', 700)
    }
    glowEnd(true, PINK, names[partner!] ?? '')
    glowEnd(false, GOLD, 'You')
    // the rope, and the line to cross
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 4; c.setLineDash([10, 8])
    c.beginPath(); c.moveTo(W / 2, 60); c.lineTo(W / 2, H - 60); c.stroke(); c.setLineDash([])
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 2
    c.beginPath(); c.moveTo(40, MID); c.lineTo(W - 40, MID); c.stroke()
    heart(c, W / 2, y, 76 + s.bump * 12, '#ff3b5c', 30)

    const [mine, theirs] = isHost ? s.taps : [s.taps[1], s.taps[0]]
    text(c, `${mine} taps`, 16, H - 70, 12, 'rgba(255,255,255,.55)', 'left', 500)
    text(c, `${theirs} taps`, 16, 70, 12, 'rgba(255,255,255,.55)', 'left', 500)
    const left = Math.max(0, Math.ceil(((s.endAt || s.cdEnd + SECONDS * 1000) - now) / 1000))
    text(c, `${Math.min(SECONDS, left)}s`, W - 16, MID - 14, 18, left <= 5 ? '#ff6b6b' : 'rgba(255,255,255,.75)', 'right', 600)
    if (now > s.cdEnd && now < s.cdEnd + 2500) text(c, 'TAP! TAP! TAP!', W / 2, MID + 64, 26, '#fff', 'center', 800)
    countdown(c, s.cdEnd - now)
  })

  return (
    <canvas
      ref={canvas}
      onPointerDown={e => { e.preventDefault(); tap() }}
      className="block w-full touch-none select-none rounded-[22px] ring-1 ring-white/10"
      style={{ aspectRatio: `${W} / ${H}` }}
      aria-label="Tug of Love: tap as fast as you can"
    />
  )
}
