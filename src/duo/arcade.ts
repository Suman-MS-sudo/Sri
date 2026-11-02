import { useEffect, useRef } from 'react'

// Every game is drawn on a canvas in its own world units (W × H) and scaled to the screen.
export const W = 360
export const H = 520
export const COUNTDOWN_MS = 3000
export const GOLD = '#EDB40B'
export const PINK = '#FF5C8A'

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** A canvas that keeps a sharp backing store at the device pixel ratio; draw in world units. */
export function useCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const ctx = useRef<CanvasRenderingContext2D | null>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const fit = () => {
      const r = el.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      el.width = Math.max(1, Math.round(r.width * dpr))
      el.height = Math.max(1, Math.round(r.height * dpr))
      const c = el.getContext('2d')!
      c.setTransform(el.width / W, 0, 0, el.height / H, 0, 0)
      ctx.current = c
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { canvas, ctx }
}

/** Runs fn every animation frame with the time step in seconds (capped, so a hidden tab can't jump). */
export function useFrame(fn: (dt: number, now: number) => void) {
  const f = useRef(fn)
  f.current = fn
  useEffect(() => {
    let raf = 0, last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      f.current(dt, now)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}

/** Calls fn at most `hz` times a second while the component is mounted. */
export function useTicker(hz: number, fn: () => void) {
  const f = useRef(fn)
  f.current = fn
  useEffect(() => {
    const t = setInterval(() => f.current(), 1000 / hz)
    return () => clearInterval(t)
  }, [hz])
}

/** Pointer x in world units, given the canvas and whether the view is turned around. */
export function worldX(e: { clientX: number }, el: HTMLCanvasElement, flipped = false) {
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * W
  return flipped ? W - x : x
}

export function heart(c: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, glow = 0) {
  c.save()
  c.translate(x, y)
  c.scale(size / 32, size / 32)
  if (glow) { c.shadowColor = fill; c.shadowBlur = glow }
  c.beginPath()
  c.moveTo(0, 10)
  c.bezierCurveTo(-18, -2, -14, -18, 0, -9)
  c.bezierCurveTo(14, -18, 18, -2, 0, 10)
  c.closePath()
  c.fillStyle = fill
  c.fill()
  c.restore()
}

export function field(c: CanvasRenderingContext2D, top: string, bottom: string) {
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
}

export function countdown(c: CanvasRenderingContext2D, msLeft: number) {
  if (msLeft <= -600) return
  const n = Math.ceil(msLeft / 1000)
  const t = msLeft > 0 ? (msLeft % 1000) / 1000 : 1 + msLeft / 600
  c.save()
  c.fillStyle = 'rgba(5, 7, 15, .55)'
  c.fillRect(0, 0, W, H)
  c.globalAlpha = Math.max(0, Math.min(1, t * 1.4))
  c.fillStyle = msLeft > 0 ? '#fff' : GOLD
  c.font = `600 ${msLeft > 0 ? 120 : 84}px "Albert Sans", sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(msLeft > 0 ? String(n) : 'GO!', W / 2, H / 2)
  c.restore()
}

export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 600) {
  c.save()
  c.fillStyle = color
  c.font = `${weight} ${size}px "Albert Sans", sans-serif`
  c.textAlign = align
  c.textBaseline = 'middle'
  c.fillText(s, x, y)
  c.restore()
}
