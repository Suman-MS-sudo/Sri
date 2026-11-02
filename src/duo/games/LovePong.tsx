import { useEffect, useRef } from 'react'
import { useDuo, type Result } from '../DuoContext'
import { clamp, COUNTDOWN_MS, countdown, field, GOLD, H, heart, PINK, text, useCanvas, useFrame, useTicker, W, worldX } from '../arcade'

export type GameProps = { onEnd: (r: Result) => void }

const PW = 84, PH = 12, R = 12, WIN = 5
const BOTTOM = H - 30, TOP = 30 // the host's paddle is at the bottom of the world, the guest's at the top

/**
 * Pong with a heart. The room's creator runs the ball; each phone moves its own paddle, and each
 * of you sees yourself at the bottom (the other phone draws the world turned around).
 */
export default function LovePong({ onEnd }: GameProps) {
  const { isHost, me, partner, state, send, listen } = useDuo()
  const names = state!.players
  const { canvas, ctx } = useCanvas()
  const g = useRef({
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
    shown: { x: W / 2, y: H / 2 }, // the guest eases toward the host's ball
    mine: W / 2,
    theirs: W / 2,
    theirsShown: W / 2,
    score: [0, 0] as [number, number], // [host, guest]
    cdEnd: performance.now() + COUNTDOWN_MS,
    serveAt: 0,
    over: false,
    keys: { left: false, right: false },
    flash: 0,
  })
  const flipped = !isHost

  // the guest hears the ball; the host hears the guest's paddle
  useEffect(() => {
    if (isHost) return listen('pong-in', m => { g.current.theirs = Number(m.x) })
    return listen('pong', m => {
      const s = g.current
      const [bx, by, hx, , hs, gs, cd] = m.d as number[]
      s.ball.x = bx; s.ball.y = by
      s.theirs = hx
      if (s.score[0] !== hs || s.score[1] !== gs) s.flash = 1
      s.score = [hs, gs]
      s.cdEnd = performance.now() + cd
    })
  }, [isHost, listen])

  // keyboard, for playing on a laptop
  useEffect(() => {
    const k = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') g.current.keys.left = down
      if (e.key === 'ArrowRight') g.current.keys.right = down
    }
    const d = k(true), u = k(false)
    addEventListener('keydown', d); addEventListener('keyup', u)
    return () => { removeEventListener('keydown', d); removeEventListener('keyup', u) }
  }, [])

  useTicker(30, () => {
    const s = g.current
    if (isHost) {
      send('pong', { d: [s.ball.x, s.ball.y, s.mine, s.theirs, s.score[0], s.score[1], Math.round(s.cdEnd - performance.now())] })
    } else send('pong-in', { x: Math.round(s.mine) })
  })

  const serve = (now: number, towardHost: boolean) => {
    const s = g.current
    s.ball = { x: W / 2, y: H / 2, vx: (Math.random() - 0.5) * 160, vy: towardHost ? 250 : -250 }
    s.serveAt = now + 900
  }

  useFrame((dt, now) => {
    const s = g.current, c = ctx.current
    // my paddle: keys (my left is the world's right when the view is turned around)
    const dir = (s.keys.right ? 1 : 0) - (s.keys.left ? 1 : 0)
    if (dir) s.mine = clamp(s.mine + dir * (flipped ? -1 : 1) * 420 * dt, PW / 2, W - PW / 2)

    if (isHost && !s.over) {
      if (now >= s.cdEnd) {
        if (!s.serveAt) serve(now, Math.random() < 0.5)
        if (now >= s.serveAt) {
          const b = s.ball
          b.x += b.vx * dt; b.y += b.vy * dt
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) }
          if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) }
          const hit = (padX: number, padY: number, down: boolean) => {
            if (Math.abs(b.y - padY) > PH / 2 + R || Math.abs(b.x - padX) > PW / 2 + R) return
            const speed = Math.min(620, Math.hypot(b.vx, b.vy) * 1.06)
            const off = clamp((b.x - padX) / (PW / 2), -1, 1)
            const ang = off * 1.0
            b.vx = Math.sin(ang) * speed
            b.vy = (down ? 1 : -1) * Math.cos(ang) * speed
            b.y = padY + (down ? 1 : -1) * (PH / 2 + R + 1)
          }
          if (b.vy > 0) hit(s.mine, BOTTOM, false)
          else hit(s.theirs, TOP, true)
          if (b.y > H + 24 || b.y < -24) {
            const guestScored = b.y > H
            s.score[guestScored ? 1 : 0]++
            s.flash = 1
            if (s.score[0] >= WIN || s.score[1] >= WIN) {
              s.over = true
              onEnd({ winner: s.score[0] > s.score[1] ? me : partner, scores: { [me]: s.score[0], [partner!]: s.score[1] } })
            } else serve(now, guestScored)
          }
        }
      }
      s.shown = { ...s.ball }
      s.theirsShown += (s.theirs - s.theirsShown) * Math.min(1, dt * 18)
    } else {
      s.shown.x += (s.ball.x - s.shown.x) * Math.min(1, dt * 16)
      s.shown.y += (s.ball.y - s.shown.y) * Math.min(1, dt * 16)
      s.theirsShown += (s.theirs - s.theirsShown) * Math.min(1, dt * 18)
    }
    s.flash = Math.max(0, s.flash - dt * 2)

    if (!c) return
    const fx = (x: number) => (flipped ? W - x : x), fy = (y: number) => (flipped ? H - y : y)
    field(c, '#1a0d1a', '#0b0f20')
    // centre line of little hearts
    for (let x = 18; x < W; x += 36) heart(c, x, H / 2, 10, 'rgba(255,255,255,.12)')
    // scores, big and faint, in each half: mine at the bottom
    const [myScore, theirScore] = isHost ? s.score : [s.score[1], s.score[0]]
    text(c, String(theirScore), W / 2, H * 0.27, 110, `rgba(255,92,138,${0.12 + s.flash * 0.2})`)
    text(c, String(myScore), W / 2, H * 0.73, 110, `rgba(237,180,11,${0.12 + s.flash * 0.2})`)
    text(c, names[partner!] ?? '', 12, 14, 13, 'rgba(255,255,255,.55)', 'left', 500)
    text(c, 'You', 12, H - 12, 13, 'rgba(255,255,255,.55)', 'left', 500)
    // paddles: mine always at the bottom of my screen
    const pad = (x: number, y: number, color: string) => {
      c.save(); c.shadowColor = color; c.shadowBlur = 14; c.fillStyle = color
      c.beginPath(); c.roundRect(x - PW / 2, y - PH / 2, PW, PH, 6); c.fill(); c.restore()
    }
    pad(fx(s.mine), fy(isHost ? BOTTOM : TOP), GOLD)
    pad(fx(s.theirsShown), fy(isHost ? TOP : BOTTOM), PINK)
    heart(c, fx(s.shown.x), fy(s.shown.y), 30, '#ff3b5c', 18)
    countdown(c, s.cdEnd - now)
    text(c, `First to ${WIN}`, W - 12, 14, 12, 'rgba(255,255,255,.4)', 'right', 500)
  })

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    g.current.mine = clamp(worldX(e, e.currentTarget, flipped), PW / 2, W - PW / 2)
  }
  return (
    <canvas
      ref={canvas}
      onPointerDown={move}
      onPointerMove={move}
      className="block w-full touch-none select-none rounded-[22px] ring-1 ring-white/10"
      style={{ aspectRatio: `${W} / ${H}` }}
      aria-label="Love Pong: slide your finger to move your paddle"
    />
  )
}
