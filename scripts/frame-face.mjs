// Turns a single portrait into the base face (faces-source/rest.png) for the living portrait:
// removes a painted or plain background, then scales and places her so her eyes and mouth land
// exactly where the portrait's hover and tap zones expect them.
//
//   npm run frame -- <image> --eyes <leftX>,<leftY>,<rightX>,<rightY> --mouth <x>,<y>
//
// Coordinates are pixels in <image>: the centres of the pupils and the middle of the lips.
// Then run `npm run faces`.

import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs/promises'
import { cutOutBackground, fadeBottom, transparentShare } from './lib/cutout.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const SIZE = 1024
const EYE_LINE = 471, MOUTH_LINE = 666 // where the engine expects them in a 1024 square

const args = process.argv.slice(2)
const flag = name => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1].split(',').map(Number) : null
}
const input = args.find(a => !a.startsWith('--') && !/^[\d.,]+$/.test(a))
const eyes = flag('--eyes'), mouth = flag('--mouth')
const name = (args.includes('--name') ? args[args.indexOf('--name') + 1] : 'rest').toLowerCase()
if (!input || eyes?.length !== 4 || mouth?.length !== 2) {
  console.log('Usage: npm run frame -- <image> --eyes <leftX>,<leftY>,<rightX>,<rightY> --mouth <x>,<y> [--name rest]')
  process.exit(1)
}

const { data, info } = await sharp(path.resolve(input)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
if (transparentShare(data) < 0.05) {
  const removed = cutOutBackground(data, info.width, info.height)
  console.log(`Removed the painted background (${Math.round(removed * 100)}% of the picture).`)
}

const eyeX = (eyes[0] + eyes[2]) / 2, eyeY = (eyes[1] + eyes[3]) / 2
const k = (MOUTH_LINE - EYE_LINE) / (mouth[1] - eyeY)
const w = Math.round(info.width * k), h = Math.round(info.height * k)
const left = Math.round(SIZE / 2 - eyeX * k), top = Math.round(EYE_LINE - eyeY * k)

const scaled = await sharp(data, { raw: info }).resize(w, h, { kernel: 'lanczos3' }).raw().toBuffer()
const sl = Math.max(0, -left), st = Math.max(0, -top), dl = Math.max(0, left), dt = Math.max(0, top)
const cw = Math.min(w - sl, SIZE - dl), ch = Math.min(h - st, SIZE - dt)
const part = await sharp(scaled, { raw: { width: w, height: h, channels: 4 } }).extract({ left: sl, top: st, width: cw, height: ch }).raw().toBuffer()
const framed = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: part, raw: { width: cw, height: ch, channels: 4 }, left: dl, top: dt }])
  .raw()
  .toBuffer()
fadeBottom(framed, SIZE, SIZE)

const out = path.join(ROOT, 'faces-source', `${name}.png`)
await sharp(framed, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(out)

// where her pupils are, so `npm run faces` can find her eyes and move only the irises
if (name === 'rest') {
  const pupils = [[eyes[0] * k + left, eyes[1] * k + top], [eyes[2] * k + left, eyes[3] * k + top]].map(p => p.map(v => +v.toFixed(1)))
  const facesDir = path.join(ROOT, 'src', 'portrait', 'faces')
  await fs.mkdir(facesDir, { recursive: true })
  await fs.writeFile(path.join(facesDir, 'eyes.json'), JSON.stringify({ pupils }, null, 2) + '\n')
}
console.log(`Saved ${path.relative(ROOT, out)}: scaled ${(k * 100).toFixed(1)}%, eyes on the ${EYE_LINE}px line, mouth on ${MOUTH_LINE}px. Now run: npm run faces`)
