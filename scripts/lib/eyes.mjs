// Finds her eyes in the resting face so the portrait can move only the iris and pupil: it measures
// each iris, traces the exact eye opening (the white and the iris, never lids, lashes or glasses),
// and paints the iris out of a copy so the white can show where the iris moves away.

const lum = (d, k) => 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]
const sat = (d, k) => Math.max(d[k], d[k + 1], d[k + 2]) - Math.min(d[k], d[k + 1], d[k + 2])

/**
 * data: RGBA of the 1024 resting face; pupils: [[x, y], [x, y]] in pixels.
 * Returns iris circles in texture units, and an RGBA "eye base": the whites with the irises painted
 * out, alpha marking the eye openings.
 */
export function analyzeEyes(data, size, pupils) {
  const base = new Uint8ClampedArray(size * size * 4)
  const isWhite = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return false
    const k = (y * size + x) * 4
    return data[k + 3] > 200 && lum(data, k) > 120 && lum(data, k) < 240 && sat(data, k) < 70
  }
  const spacing = Math.abs(pupils[1][0] - pupils[0][0])
  const irises = []

  for (const [px0, py0] of pupils) {
    const px = Math.round(px0), py = Math.round(py0)

    // the iris: the widest dark span between the whites, measured below the catchlight
    let best = null
    for (let y = py; y <= py + 18; y++) {
      let l = px, r = px
      while (l > px - spacing * 0.35 && !(isWhite(l, y) && isWhite(l - 1, y) && isWhite(l - 2, y))) l--
      while (r < px + spacing * 0.35 && !(isWhite(r, y) && isWhite(r + 1, y) && isWhite(r + 2, y))) r++
      if (isWhite(l, y) && isWhite(r, y) && (!best || r - l > best.w)) best = { w: r - l, y, l, r }
    }
    const R = best ? best.w / 2 : spacing * 0.15
    const cx = best ? (best.l + best.r) / 2 : px
    const cy = best ? best.y : py + spacing * 0.03

    // the white of the eye, flooded from both sides of the iris
    const box = { x0: Math.floor(cx - R * 2.8), x1: Math.ceil(cx + R * 2.8), y0: Math.floor(cy - R * 1.5), y1: Math.ceil(cy + R * 1.5) }
    const white = new Set()
    const queue = []
    if (best) for (const x of [best.l, best.r]) { const k = best.y * size + x; white.add(k); queue.push(k) }
    while (queue.length) {
      const k = queue.pop(), x = k % size, y = (k / size) | 0
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < box.x0 || nx > box.x1 || ny < box.y0 || ny > box.y1) continue
        const n = ny * size + nx
        if (white.has(n) || !isWhite(nx, ny)) continue
        // the lens glare over skin is also light and grey: stay close to the iris
        if (Math.hypot(nx - cx, (ny - cy) * 1.6) > R * 2.6) continue
        white.add(n)
        queue.push(n)
      }
    }
    let yTop = Infinity, yBot = -Infinity
    for (const k of white) { const y = (k / size) | 0; yTop = Math.min(yTop, y); yBot = Math.max(yBot, y) }

    // the opening, row by row: from the leftmost to the rightmost white, plus the visible iris
    const open = new Set()
    for (let y = Math.max(box.y0, yTop - 1); y <= Math.min(box.y1, yBot + 1); y++) {
      let x0 = Infinity, x1 = -Infinity
      for (let x = box.x0; x <= box.x1; x++) {
        const inIris = Math.hypot(x - cx, y - cy) <= R * 1.03
        if (white.has(y * size + x) || inIris) { x0 = Math.min(x0, x); x1 = Math.max(x1, x) }
      }
      for (let x = x0; x <= x1; x++) open.add(y * size + x)
    }

    // Paint the iris out with a harmonic fill: every hidden pixel becomes the average of its
    // neighbours, with the visible whites held fixed, so the white and its shading under the lid
    // flow smoothly across where the iris was. Edges of the opening are left free.
    // (the iris's soft dark rim is not white: keep a margin around it)
    const W = box.x1 - box.x0 + 3, Hh = box.y1 - box.y0 + 3
    const at = (x, y) => (y - box.y0 + 1) * W + (x - box.x0 + 1)
    const inside = new Uint8Array(W * Hh), isFixed = new Uint8Array(W * Hh), col = new Float32Array(W * Hh * 3)
    let seed = [0, 0, 0], n = 0
    for (const k of open) {
      const x = k % size, y = (k / size) | 0, i = at(x, y), p = k * 4
      inside[i] = 1
      if (white.has(k) && lum(data, p) > 140 && Math.hypot(x - cx, y - cy) > R * 1.15) {
        isFixed[i] = 1
        for (let c = 0; c < 3; c++) col[i * 3 + c] = data[p + c]
        seed = [seed[0] + data[p], seed[1] + data[p + 1], seed[2] + data[p + 2]]; n++
      }
    }
    seed = n ? seed.map(v => v / n) : [205, 192, 186]
    for (let i = 0; i < W * Hh; i++) if (inside[i] && !isFixed[i]) for (let c = 0; c < 3; c++) col[i * 3 + c] = seed[c]
    for (let it = 0; it < 500; it++)
      for (let i = W; i < W * Hh - W; i++) {
        if (!inside[i] || isFixed[i]) continue
        let m = 0, r = 0, g = 0, b = 0
        for (const j of [i - 1, i + 1, i - W, i + W]) if (inside[j]) { r += col[j * 3]; g += col[j * 3 + 1]; b += col[j * 3 + 2]; m++ }
        if (m) { col[i * 3] = r / m; col[i * 3 + 1] = g / m; col[i * 3 + 2] = b / m }
      }
    for (const k of open) {
      const i = at(k % size, (k / size) | 0), p = k * 4
      base[p] = col[i * 3]; base[p + 1] = col[i * 3 + 1]; base[p + 2] = col[i * 3 + 2]; base[p + 3] = 255
    }
    irises.push([cx / size, cy / size, R / size].map(v => +v.toFixed(5)))
  }

  // soften the painted-in white a little, and the edge of the openings by one pixel
  const out = new Uint8ClampedArray(base)
  for (let y = 1; y < size - 1; y++)
    for (let x = 1; x < size - 1; x++) {
      const k = (y * size + x) * 4
      const taps = [[k, 4], [k - 4, 1], [k + 4, 1], [k - size * 4, 1], [k + size * 4, 1]]
      let a = 0, w = 0
      for (const [t, f] of taps) { a += base[t + 3] * f; w += f }
      if (!a) continue
      for (let c = 0; c < 3; c++) {
        let s = 0
        for (const [t, f] of taps) s += base[t + c] * base[t + 3] * f
        out[k + c] = s / a
      }
      out[k + 3] = a / w
    }
  return { iris: { l: irises[0], r: irises[1] }, base: Buffer.from(out.buffer) }
}
