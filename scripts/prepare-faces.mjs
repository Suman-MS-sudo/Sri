// Prepares her face set for the living portrait.
//
//   1. Put the pictures in faces-source/, each named after its face: rest.png, half.png, kiss.png ...
//   2. npm run faces
//
// Every picture is fitted to a 1024px square, lined up with rest.png (AI tools drift a few pixels
// between edits, and the portrait swaps whole pictures, so drift shows as a jump), and written as
// WebP at 1024px and 640px into src/portrait/faces/, where the page picks them up automatically.
// The report lists what is still missing, with the edit prompt for each.
//
// Flags: --no-align   keep every picture exactly where it is

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { cutOutBackground, fadeBottom, transparentShare } from './lib/cutout.mjs'
import { analyzeEyes } from './lib/eyes.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'faces-source')
const OUT = path.join(ROOT, 'src', 'portrait', 'faces')
const LIST = JSON.parse(await fs.readFile(path.join(ROOT, 'src', 'portrait', 'faceList.json'), 'utf8'))
const NAMES = LIST.faces.map(f => f.name)
const ALIGN = !process.argv.includes('--no-align')

const SIZE = 1024
const SIZES = [1024, 640]
const A = 256 // analysis size for alignment
const RAW = { raw: { width: SIZE, height: SIZE, channels: 4 } }
const EXT = new Set(['.png', '.webp', '.jpg', '.jpeg'])

const warn = s => console.log('  \x1b[33m⚠\x1b[0m ' + s)
const bad = s => console.log('  \x1b[31m✗\x1b[0m ' + s)

// ---- find the pictures ----
await fs.mkdir(SRC, { recursive: true })
const inputs = new Map()
for (const file of await fs.readdir(SRC)) {
  const ext = path.extname(file).toLowerCase()
  const name = path.basename(file, path.extname(file)).toLowerCase()
  if (!EXT.has(ext) || name.startsWith('_')) continue
  if (!NAMES.includes(name)) {
    const guess = NAMES.filter(n => Math.abs(n.length - name.length) <= 2 && (n.includes(name) || name.includes(n)))
    warn(`${file}: "${name}" is not a face name${guess.length ? `, did you mean ${guess.join(' / ')}?` : ''} (skipped)`)
    continue
  }
  if (inputs.has(name)) warn(`${file}: there is already a picture for "${name}", using ${inputs.get(name)}`)
  else inputs.set(name, file)
}

if (!inputs.has('rest')) {
  bad('faces-source/rest.png is missing. Her resting face is the base every other picture lines up with.')
  console.log('\n  Make it first, with this prompt and a clear photo of her:\n\n  ' + LIST.base + '\n')
  process.exit(1)
}

// ---- helpers ----
// AI tools often paint a fake checkerboard instead of a real transparent background; that is
// removed here at full resolution, before the picture is fitted to the square.
async function load(file) {
  const { data, info } = await sharp(path.join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const painted = transparentShare(data) < 0.05
  if (painted) cutOutBackground(data, info.width, info.height)
  const buf = await sharp(data, { raw: info }).resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).raw().toBuffer()
  return { buf, width: info.width, height: info.height, painted }
}

// luminance weighted by alpha, at analysis size
async function analysis(buf) {
  const small = await sharp(buf, RAW).resize(A, A).raw().toBuffer()
  const out = new Float32Array(A * A)
  for (let i = 0; i < A * A; i++) {
    const r = small[i * 4], g = small[i * 4 + 1], b = small[i * 4 + 2], a = small[i * 4 + 3] / 255
    out[i] = (0.299 * r + 0.587 * g + 0.114 * b) * a
  }
  return out
}

// Compare the face area only (the hair may legitimately change: wind, colours), searching for the
// scale s about the centre and shift d that make the candidate sit on top of rest.
const X0 = Math.round(A * 0.25), X1 = Math.round(A * 0.75), Y0 = Math.round(A * 0.22), Y1 = Math.round(A * 0.82)
const AREA = (X1 - X0) * (Y1 - Y0)
const C = A / 2
function diff(rest, cand, s, dx, dy) {
  let sum = 0
  for (let y = Y0; y < Y1; y++) {
    const sy = Math.round((y - C - dy) / s + C)
    for (let x = X0; x < X1; x++) {
      const sx = Math.round((x - C - dx) / s + C)
      const v = sx >= 0 && sy >= 0 && sx < A && sy < A ? cand[sy * A + sx] : 0
      sum += Math.abs(rest[y * A + x] - v)
    }
  }
  return sum / AREA
}
function align(rest, cand) {
  let best = { s: 1, dx: 0, dy: 0, d: diff(rest, cand, 1, 0, 0) }
  const before = best.d
  for (let s = 0.9; s <= 1.1001; s += 0.02)
    for (let dy = -24; dy <= 24; dy += 3)
      for (let dx = -24; dx <= 24; dx += 3) {
        const d = diff(rest, cand, s, dx, dy)
        if (d < best.d) best = { s, dx, dy, d }
      }
  const c = best
  for (let s = c.s - 0.01; s <= c.s + 0.0101; s += 0.005)
    for (let dy = c.dy - 2; dy <= c.dy + 2; dy++)
      for (let dx = c.dx - 2; dx <= c.dx + 2; dx++) {
        const d = diff(rest, cand, s, dx, dy)
        if (d < best.d) best = { s, dx, dy, d }
      }
  return { ...best, before }
}

// scale about the centre and shift, on a transparent square
async function place(buf, s, dx, dy) {
  if (s === 1 && dx === 0 && dy === 0) return buf
  const k = SIZE / A
  const w = Math.round(SIZE * s)
  const scaled = await sharp(buf, RAW).resize(w, w).raw().toBuffer()
  const left = Math.round(SIZE / 2 - w / 2 + dx * k), top = Math.round(SIZE / 2 - w / 2 + dy * k)
  const sl = Math.max(0, -left), st = Math.max(0, -top), dl = Math.max(0, left), dt = Math.max(0, top)
  const cw = Math.min(w - sl, SIZE - dl), ch = Math.min(w - st, SIZE - dt)
  const crop = await sharp(scaled, { raw: { width: w, height: w, channels: 4 } }).extract({ left: sl, top: st, width: cw, height: ch }).raw().toBuffer()
  return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: crop, raw: { width: cw, height: ch, channels: 4 }, left: dl, top: dt }])
    .raw()
    .toBuffer()
}

// ---- process ----
for (const size of SIZES) {
  await fs.rm(path.join(OUT, String(size)), { recursive: true, force: true })
  await fs.mkdir(path.join(OUT, String(size)), { recursive: true })
}

console.log(`\nPreparing ${inputs.size} picture(s) from faces-source/${ALIGN ? ', lining each up with rest' : ''}\n`)

const rest = await load(inputs.get('rest'))
const restA = await analysis(rest.buf)
let problems = 0

for (const name of NAMES.filter(n => inputs.has(n))) {
  const file = inputs.get(name)
  const img = name === 'rest' ? rest : await load(file)
  const notes = []

  if (img.width !== img.height) notes.push(`not square (${img.width}×${img.height}), padded to a square`)
  if (img.painted) notes.push('the background was painted in, not transparent; removed it')

  let buf = img.buf, fix = ''
  if (ALIGN && name !== 'rest') {
    const a = await analysis(img.buf)
    const r = align(restA, a)
    const moved = Math.abs(r.dx) >= 1 || Math.abs(r.dy) >= 1 || Math.abs(r.s - 1) >= 0.005
    if (moved) {
      buf = await place(img.buf, r.s, r.dx, r.dy)
      const k = SIZE / A
      fix = `moved ${Math.round(r.dx * k)},${Math.round(r.dy * k)}px, scaled ${(r.s * 100).toFixed(1)}%`
    }
    if (Math.abs(r.dx) >= 24 || Math.abs(r.dy) >= 24 || r.s <= 0.901 || r.s >= 1.099) {
      notes.push('framing is very different from rest; regenerate it by editing rest.png')
      problems++
    } else if (r.d > 34) {
      notes.push('still looks quite different from rest after lining up; check it on the /?faces page')
    }
  }

  // pictures that came with a painted background get the same soft bottom edge as her framed rest
  if (img.painted && name !== 'rest') fadeBottom(buf, SIZE, SIZE)

  for (const size of SIZES) {
    await sharp(buf, RAW)
      .resize(size, size)
      .webp({ quality: 88, alphaQuality: 92, effort: 5 })
      .toFile(path.join(OUT, String(size), `${name}.webp`))
  }
  console.log(`  \x1b[32m✓\x1b[0m ${name.padEnd(10)} ${fix}`)
  for (const n of notes) warn(`${name}: ${n}`)
}

// ---- her eyes: only the iris and pupil move, everything else stays put ----
const EYES_FILE = path.join(OUT, 'eyes.json')
const eyesInfo = await fs.readFile(EYES_FILE, 'utf8').then(JSON.parse).catch(() => null)
if (eyesInfo?.pupils) {
  const { iris, base } = analyzeEyes(rest.buf, SIZE, eyesInfo.pupils)
  for (const size of SIZES)
    await sharp(base, RAW).resize(size, size).webp({ quality: 92, alphaQuality: 100, effort: 5 }).toFile(path.join(OUT, String(size), 'eyebase.webp'))
  await fs.writeFile(EYES_FILE, JSON.stringify({ pupils: eyesInfo.pupils, iris }, null, 2) + '\n')
  console.log(`  \x1b[32m✓\x1b[0m eyes       irises found, radius ${Math.round(iris.l[2] * SIZE)}px and ${Math.round(iris.r[2] * SIZE)}px`)
}

// ---- report ----
const tiers = [
  [1, 'Essential: gaze, blinks, hover and the Contact-button hearts'],
  [2, 'Reactions: taps, pulls and shaking'],
  [3, 'Smoother eye-following'],
  [4, 'Idle acts and hair colours'],
]
console.log('\nCoverage')
for (const [t, label] of tiers) {
  const all = LIST.faces.filter(f => f.tier === t)
  const have = all.filter(f => inputs.has(f.name)).length
  console.log(`  Tier ${t}  ${String(have).padStart(2)}/${all.length}  ${label}`)
}

const next = tiers.map(([t]) => LIST.faces.filter(f => f.tier === t && !inputs.has(f.name))).find(m => m.length)
if (next) {
  console.log(`\nNext to make (edit rest.png with each prompt, save as <name>.png in faces-source/):\n`)
  for (const f of next) console.log(`  ${f.name}.png\n    ${LIST.edit} ${f.change}\n`)
} else {
  console.log('\nAll 58 faces are in. 💕')
}

console.log(problems ? `\n${problems} picture(s) need attention (see ⚠ above).\n` : '\nDone. Run npm run dev and open /?faces to check the alignment.\n')
