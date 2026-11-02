// AI image tools often "export a transparent background" by painting a grey-and-white checkerboard
// into an opaque image. This removes such a painted background (or any plain light background):
// starting from the image border it takes every light, colourless pixel it can reach, stops at
// hair and skin, then softens the edge and pulls the light fringe out of it, so the cut-out sits
// cleanly on a dark page.

const LIGHT = 150 // background pixels are at least this bright
const NEUTRAL = 26 // and at most this colourful (max - min channel)
const STEP = 46 // and similar to the neighbour they were reached from

const lum = (d, k) => 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]
const sat = (d, k) => Math.max(d[k], d[k + 1], d[k + 2]) - Math.min(d[k], d[k + 1], d[k + 2])

/** Share of pixels that are already transparent. */
export function transparentShare(data) {
  let n = 0
  for (let k = 3; k < data.length; k += 4) if (data[k] < 250) n++
  return n / (data.length / 4)
}

/** Removes a painted light background in place (RGBA, width × height). Returns the share removed. */
export function cutOutPaintedBackground(data, width, height) {
  const N = width * height
  const bg = new Uint8Array(N)
  const queue = new Int32Array(N)
  let head = 0, tail = 0
  const isBg = k => lum(data, k * 4) >= LIGHT && sat(data, k * 4) <= NEUTRAL

  for (let x = 0; x < width; x++) for (const y of [0, height - 1]) { const k = y * width + x; if (!bg[k] && isBg(k)) { bg[k] = 1; queue[tail++] = k } }
  for (let y = 0; y < height; y++) for (const x of [0, width - 1]) { const k = y * width + x; if (!bg[k] && isBg(k)) { bg[k] = 1; queue[tail++] = k } }

  const flood = () => {
    while (head < tail) {
      const k = queue[head++], x = k % width, y = (k / width) | 0, l = lum(data, k * 4)
      for (const n of [x > 0 ? k - 1 : -1, x < width - 1 ? k + 1 : -1, y > 0 ? k - width : -1, y < height - 1 ? k + width : -1]) {
        if (n < 0 || bg[n] || !isBg(n) || Math.abs(lum(data, n * 4) - l) > STEP) continue
        bg[n] = 1
        queue[tail++] = n
      }
    }
  }
  flood()

  // AI tools like to draw thin stray strands just outside the hair, which fence in pockets of the
  // painted background. Step across anything thinner than JUMP pixels and keep flooding. The eyes,
  // teeth and lens glare are far inside the face, so they are never reached.
  const JUMP = 7
  for (let pass = 0; pass < 3; pass++) {
    const near = new Uint8Array(N)
    const rowNear = new Uint8Array(N)
    for (let y = 0; y < height; y++) {
      let last = -1e9
      for (let x = 0; x < width; x++) { if (bg[y * width + x]) last = x; if (x - last <= JUMP) rowNear[y * width + x] = 1 }
      last = 1e9
      for (let x = width - 1; x >= 0; x--) { if (bg[y * width + x]) last = x; if (last - x <= JUMP) rowNear[y * width + x] = 1 }
    }
    for (let x = 0; x < width; x++) {
      let last = -1e9
      for (let y = 0; y < height; y++) { if (rowNear[y * width + x]) last = y; if (y - last <= JUMP) near[y * width + x] = 1 }
      last = 1e9
      for (let y = height - 1; y >= 0; y--) { if (rowNear[y * width + x]) last = y; if (last - y <= JUMP) near[y * width + x] = 1 }
    }
    const before = tail
    for (let k = 0; k < N; k++) if (near[k] && !bg[k] && isBg(k) && lum(data, k * 4) >= 185) { bg[k] = 1; queue[tail++] = k }
    if (tail === before) break
    flood()
  }

  // alpha: background out; along the edge, neutral pixels are a mix of hair and the light
  // background, so un-mix them; coloured pixels (skin) stay solid
  const alpha = new Float32Array(N)
  for (let k = 0; k < N; k++) alpha[k] = bg[k] ? 0 : 1
  const R = 3
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const k = y * width + x
      if (bg[k]) continue
      let near = false
      for (let dy = -R; dy <= R && !near; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx >= 0 && yy >= 0 && xx < width && yy < height && bg[yy * width + xx]) { near = true; break }
        }
      if (!near) continue
      const p = k * 4
      if (sat(data, p) > 40) continue
      const a = Math.min(1, Math.max(0, (242 - lum(data, p)) / 180))
      alpha[k] = a
      if (a > 0.02) for (let c = 0; c < 3; c++) data[p + c] = Math.max(0, Math.min(255, (data[p + c] - (1 - a) * 242) / a))
    }

  // a light blur on the edge only, against jaggies
  const out = new Float32Array(alpha)
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const k = y * width + x
      if (alpha[k] === 1 && alpha[k - 1] === 1 && alpha[k + 1] === 1 && alpha[k - width] === 1 && alpha[k + width] === 1) continue
      out[k] = (alpha[k] * 4 + alpha[k - 1] + alpha[k + 1] + alpha[k - width] + alpha[k + width]) / 8
    }

  let removed = 0
  for (let k = 0; k < N; k++) {
    data[k * 4 + 3] = Math.round(out[k] * 255)
    if (bg[k]) removed++
  }
  return removed / N
}

/**
 * Removes a plain dark background in place: whatever is close to the border's colour and connected
 * to the border goes, with a soft edge. Dark hair right next to a dark background may lose a little
 * edge, which doesn't show on the portrait's equally dark page.
 */
export function cutOutDarkBackground(data, width, height, tolerance = 16) {
  const N = width * height
  const border = []
  for (let x = 0; x < width; x += 2) border.push(x, (height - 1) * width + x)
  for (let y = 0; y < height; y += 2) border.push(y * width, y * width + width - 1)
  const med = c => border.map(k => data[k * 4 + c]).sort((a, b) => a - b)[border.length >> 1]
  const B = [med(0), med(1), med(2)]
  const dist = k => Math.max(Math.abs(data[k * 4] - B[0]), Math.abs(data[k * 4 + 1] - B[1]), Math.abs(data[k * 4 + 2] - B[2]))

  const bg = new Uint8Array(N), queue = new Int32Array(N)
  let head = 0, tail = 0
  for (const k of border) if (!bg[k] && dist(k) < tolerance) { bg[k] = 1; queue[tail++] = k }
  while (head < tail) {
    const k = queue[head++], x = k % width, y = (k / width) | 0
    for (const n of [x > 0 ? k - 1 : -1, x < width - 1 ? k + 1 : -1, y > 0 ? k - width : -1, y < height - 1 ? k + width : -1]) {
      if (n < 0 || bg[n] || dist(n) >= tolerance) continue
      bg[n] = 1
      queue[tail++] = n
    }
  }

  let removed = 0
  for (let k = 0; k < N; k++) {
    if (bg[k]) { data[k * 4 + 3] = 0; removed++; continue }
    // a soft key along the edge, pulling the background colour out of half-covered pixels
    const x = k % width, y = (k / width) | 0
    let near = false
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx >= 0 && yy >= 0 && xx < width && yy < height && bg[yy * width + xx]) { near = true; break }
    }
    if (!near) continue
    const t = Math.min(1, Math.max(0, (dist(k) - tolerance * 0.5) / (tolerance * 2.5)))
    const a = t * t * (3 - 2 * t)
    data[k * 4 + 3] = Math.round(a * 255)
    if (a > 0.05) for (let c = 0; c < 3; c++) data[k * 4 + c] = Math.max(0, Math.min(255, (data[k * 4 + c] - (1 - a) * B[c]) / a))
  }
  return removed / N
}

/** Removes a painted or plain background, light or dark. Returns the share removed. */
export function cutOutBackground(data, width, height) {
  const corners = [0, width - 1, (height - 1) * width, height * width - 1]
  const light = corners.filter(k => lum(data, k * 4) > 120).length >= 2
  return light ? cutOutPaintedBackground(data, width, height) : cutOutDarkBackground(data, width, height)
}

/**
 * Fades the bottom of a square picture from just below the chin, so the hair ends softly (no hard
 * line at the edge, and no painted checkerboard showing through thin hair tips).
 */
export function fadeBottom(data, width, height, share = 0.25) {
  const from = Math.round(height * (1 - share))
  for (let y = from; y < height; y++) {
    const t = (y - from) / (height - from)
    const f = 1 - t * t * (3 - 2 * t) * 1.15 < 0 ? 0 : 1 - t * t * (3 - 2 * t) * 1.15
    for (let x = 0; x < width; x++) {
      const k = (y * width + x) * 4 + 3
      data[k] = Math.round(data[k] * f)
    }
  }
}
