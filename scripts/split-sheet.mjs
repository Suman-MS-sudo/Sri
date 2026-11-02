// Cuts a sheet of expressions (an AI tool's grid of faces) into named pictures for the portrait.
// Every cell of a sheet is drawn the same way, so one set of landmarks (measured in one cell)
// frames them all; `npm run faces` then lines up whatever is left over.
//
//   npm run sheet -- <image> --grid <cols>x<rows> --eyes <lx>,<ly>,<rx>,<ry> --mouth <x>,<y>
//                    --map r1c1=rest,r4c2=closed,r2c3=winkr,r1c1=laugh+grin ...
//
// --eyes and --mouth are pupil and lip-middle pixels inside a cell (cell coordinates).
// A cell may get several names (laugh+grin). Mapping a cell to rest also records where her pupils are.

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'
import { cutOutBackground, fadeBottom, transparentShare } from './lib/cutout.mjs'
import { SIZE, placedPupils, place, placement } from './lib/frame.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null)
const nums = s => s.split(',').map(Number)

const input = args[0]
const [cols, rows] = (opt('--grid') || '').split('x').map(Number)
const eyes = opt('--eyes') && nums(opt('--eyes'))
const mouth = opt('--mouth') && nums(opt('--mouth'))
const map = (opt('--map') || '').split(',').filter(Boolean).map(s => s.split('='))
if (!input || !cols || !rows || eyes?.length !== 4 || mouth?.length !== 2 || !map.length) {
  console.log('Usage: npm run sheet -- <image> --grid 6x5 --eyes lx,ly,rx,ry --mouth x,y --map r1c1=rest,r4c2=closed')
  process.exit(1)
}

const sheet = sharp(path.resolve(input))
const { width, height } = await sheet.metadata()
const cw = width / cols, ch = height / rows
const where = placement(eyes, mouth)

for (const [cell, names] of map) {
  const m = /^r(\d+)c(\d+)$/.exec(cell)
  if (!m) { console.log(`  skipped "${cell}": cells are written r<row>c<col>, e.g. r1c1`); continue }
  const r = +m[1] - 1, c = +m[2] - 1
  const box = { left: Math.round(c * cw), top: Math.round(r * ch), width: Math.round(cw), height: Math.round(ch) }
  const { data, info } = await sharp(path.resolve(input)).extract(box).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (transparentShare(data) < 0.05) cutOutBackground(data, info.width, info.height)
  const framed = await place(data, info.width, info.height, where)
  fadeBottom(framed, SIZE, SIZE)
  for (const name of names.split('+')) {
    await sharp(framed, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(path.join(ROOT, 'faces-source', `${name}.png`))
    if (name === 'rest') {
      const dir = path.join(ROOT, 'src', 'portrait', 'faces')
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, 'eyes.json'), JSON.stringify({ pupils: placedPupils(eyes, where) }, null, 2) + '\n')
    }
  }
  console.log(`  ${cell} → ${names.split('+').join(', ')}`)
}
console.log(`Scaled ${(where.k * 100).toFixed(0)}%. Now run: npm run faces`)
