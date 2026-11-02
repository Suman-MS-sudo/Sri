// Places a face on the portrait's 1024px square so her eyes and mouth land where the engine's hover
// and tap zones expect them, and describes her eye openings for the in-picture eye movement.

import sharp from 'sharp'

export const SIZE = 1024
const EYE_LINE = 471, MOUTH_LINE = 666

/** The scale and offset that put these landmarks (pupils, middle of the lips) on the guide lines. */
export function placement(eyes, mouth) {
  const eyeX = (eyes[0] + eyes[2]) / 2, eyeY = (eyes[1] + eyes[3]) / 2
  const k = (MOUTH_LINE - EYE_LINE) / (mouth[1] - eyeY)
  return { k, left: SIZE / 2 - eyeX * k, top: EYE_LINE - eyeY * k }
}

/** Scales and places an RGBA picture on a transparent 1024 square. */
export async function place(data, width, height, { k, left, top }) {
  const w = Math.round(width * k), h = Math.round(height * k)
  const l = Math.round(left), t = Math.round(top)
  const scaled = await sharp(data, { raw: { width, height, channels: 4 } }).resize(w, h, { kernel: 'lanczos3' }).raw().toBuffer()
  const sl = Math.max(0, -l), st = Math.max(0, -t), dl = Math.max(0, l), dt = Math.max(0, t)
  const cw = Math.min(w - sl, SIZE - dl), ch = Math.min(h - st, SIZE - dt)
  const part = await sharp(scaled, { raw: { width: w, height: h, channels: 4 } }).extract({ left: sl, top: st, width: cw, height: ch }).raw().toBuffer()
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: part, raw: { width: cw, height: ch, channels: 4 }, left: dl, top: dt }])
    .raw()
    .toBuffer()
}

/** Where her pupils end up on the 1024 square; `npm run faces` measures her eyes from there. */
export function placedPupils(eyes, { k, left, top }) {
  return [[eyes[0] * k + left, eyes[1] * k + top], [eyes[2] * k + left, eyes[3] * k + top]].map(p => p.map(v => +v.toFixed(1)))
}
