// Draws Sami as an animated character: every expression the living portrait needs, from one
// drawing, so all 58 pictures line up perfectly. Writes faces-source/<name>.png.
//
//   npm run avatar      (draws, then prepares them for the page)
//
// Change LOOK below to make her look more like herself.

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const LOOK = {
  skin: '#C68B62',
  skinLight: '#DFAA80',
  skinShade: '#A2673F',
  lid: '#B07148',
  hair: '#1A1311',
  hairShine: '#4B3830',
  iris: '#3A2316',
  irisLight: '#7A4E2C',
  lips: '#B4535E',
  lipsDark: '#8A3640',
  mouth: '#4E1820',
  tongue: '#E07A86',
  glasses: '#272022',
  bindi: '#8E1B2B',
  blush: '#E8606E',
}
const HAIR_COLOURS = { pink: ['#D97BA6', '#F6BFD7'], blue: ['#6F98DD', '#B0CAF4'], blonde: ['#DDBF78', '#F8E7B8'] }

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'faces-source')

// the portrait's layout: eyes on the 46% line, mouth on 65%, chin on 76%
const CX = 512, EL = 418, ER = 606, EY = 471, MY = 666

// ---------- hair ----------
const BACK_HAIR =
  'M 512 40 C 310 40 190 160 172 340 C 155 520 165 720 115 880 C 100 940 130 985 200 990 C 270 994 330 980 380 960 ' +
  'C 420 880 432 780 444 720 Q 512 690 580 720 C 592 780 604 880 644 960 C 694 980 754 994 824 990 C 894 985 924 940 909 880 ' +
  'C 859 720 869 520 852 340 C 834 160 714 40 512 40 Z'

// one front curtain of hair; s = -1 for the left side of the picture, +1 for the right
function curtain(s) {
  const X = dx => CX + s * dx
  return (
    `M ${X(0)} 172 C ${X(84)} 172 ${X(168)} 226 ${X(196)} 318 C ${X(208)} 380 ${X(208)} 450 ${X(205)} 540 ` +
    `C ${X(196)} 640 ${X(206)} 740 ${X(226)} 860 C ${X(236)} 920 ${X(262)} 960 ${X(290)} 990 L ${X(370)} 985 ` +
    `C ${X(345)} 900 ${X(340)} 760 ${X(338)} 620 C ${X(336)} 420 ${X(320)} 250 ${X(230)} 170 ` +
    `C ${X(170)} 120 ${X(80)} 108 ${X(0)} 112 Z`
  )
}
function strands(s) {
  const X = dx => CX + s * dx
  return [
    [`M ${X(14)} 176 C ${X(110)} 190 ${X(196)} 260 ${X(214)} 380 C ${X(226)} 520 ${X(226)} 700 ${X(262)} 900`, 6, 0.7],
    [`M ${X(30)} 140 C ${X(160)} 150 ${X(262)} 250 ${X(270)} 440 C ${X(276)} 620 ${X(282)} 780 ${X(318)} 960`, 5, 0.55],
    [`M ${X(60)} 120 C ${X(200)} 130 ${X(306)} 250 ${X(312)} 470 C ${X(316)} 660 ${X(318)} 820 ${X(350)} 970`, 4, 0.45],
    [`M ${X(250)} 200 C ${X(310)} 280 ${X(330)} 400 ${X(334)} 560`, 4, 0.35],
  ]
    .map(([d, w, o]) => `<path d="${d}" stroke="url(#hairShine)" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${o}"/>`)
    .join('')
}

const FACE = 'M 512 246 C 646 246 722 330 722 470 C 722 604 680 704 594 754 Q 512 800 430 754 C 344 704 302 604 302 470 C 302 330 378 246 512 246 Z'

// ---------- eyes ----------
const whitePath = (cx, cy, wide) => {
  const t = wide ? 40 : 32, b = wide ? 30 : 24
  return `M ${cx - 48} ${cy} C ${cx - 32} ${cy - t} ${cx + 32} ${cy - t} ${cx + 48} ${cy} C ${cx + 32} ${cy + b} ${cx - 32} ${cy + b} ${cx - 48} ${cy} Z`
}
const flick = (cx, cy, s) => `<path d="M ${cx + s * 48} ${cy - 1} L ${cx + s * 62} ${cy - 14}" stroke="${LOOK.hair}" stroke-width="6" stroke-linecap="round"/>`

function eye(cx, s, e, id) {
  const cy = EY
  const kind = e.kind || 'open'
  const line = (d, w = 7) => `<path d="${d}" stroke="${LOOK.hair}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`

  if (kind === 'closed')
    return line(`M ${cx - 44} ${cy + 2} Q ${cx} ${cy + 22} ${cx + 44} ${cy + 2}`) + flick(cx, cy + 3, s)
  if (kind === 'happy') return line(`M ${cx - 40} ${cy + 10} Q ${cx} ${cy - 26} ${cx + 40} ${cy + 10}`, 8)
  if (kind === 'squeeze')
    return s < 0
      ? line(`M ${cx - 30} ${cy - 18} L ${cx + 24} ${cy} L ${cx - 30} ${cy + 18}`, 8)
      : line(`M ${cx + 30} ${cy - 18} L ${cx - 24} ${cy} L ${cx + 30} ${cy + 18}`, 8)
  if (kind === 'hearts')
    return (
      `<path d="M ${cx} ${cy + 30} C ${cx - 50} ${cy} ${cx - 34} ${cy - 40} ${cx} ${cy - 15} C ${cx + 34} ${cy - 40} ${cx + 50} ${cy} ${cx} ${cy + 30} Z" fill="#FF4F8B" stroke="#D93070" stroke-width="3"/>` +
      `<ellipse cx="${cx - 16}" cy="${cy - 12}" rx="8" ry="5" fill="#fff" opacity=".8" transform="rotate(-30 ${cx - 16} ${cy - 12})"/>`
    )
  if (kind === 'stars') {
    let d = ''
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 15 : 38, a = -Math.PI / 2 + (i * Math.PI) / 5
      d += `${i ? 'L' : 'M'} ${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + 2 + r * Math.sin(a)).toFixed(1)} `
    }
    return `<path d="${d}Z" fill="#FFC93C" stroke="#E39A12" stroke-width="3" stroke-linejoin="round"/><circle cx="${cx - 8}" cy="${cy - 8}" r="5" fill="#fff" opacity=".85"/>`
  }
  if (kind === 'spiral') {
    let d = ''
    for (let i = 0; i <= 90; i++) {
      const a = i * 0.19, r = 2 + i * 0.36
      d += `${i ? 'L' : 'M'} ${(cx + r * Math.cos(a * s)).toFixed(1)} ${(cy + r * Math.sin(a * s)).toFixed(1)} `
    }
    return `<path d="${d}" stroke="${LOOK.hair}" stroke-width="5" fill="none" stroke-linecap="round"/>`
  }

  // an open eye, maybe wide, maybe with a lid down
  const wide = kind === 'wide'
  const gx = e.gx || 0, gy = e.gy || 0
  const ix = cx + gx * 20, iy = cy + gy * 12
  const ir = wide ? 19 : 24
  const t = wide ? 40 : 32
  let lid = ''
  if (kind === 'half' || kind === 'heavy') {
    const edge = kind === 'half' ? 6 : -5
    lid =
      `<path d="M ${cx - 50} ${cy - 44} L ${cx + 50} ${cy - 44} L ${cx + 50} ${cy + 1} Q ${cx} ${cy + edge * 2} ${cx - 50} ${cy + 1} Z" fill="${LOOK.lid}"/>`
  }
  const lash =
    kind === 'half' || kind === 'heavy'
      ? line(`M ${cx - 46} ${cy + 1} Q ${cx} ${cy + (kind === 'half' ? 12 : -10)} ${cx + 46} ${cy + 1}`)
      : line(`M ${cx - 50} ${cy + 1} C ${cx - 32} ${cy - t - 2} ${cx + 32} ${cy - t - 2} ${cx + 50} ${cy + 1}`)
  return (
    `<clipPath id="w${id}"><path d="${whitePath(cx, cy, wide)}"/></clipPath>` +
    `<path d="${whitePath(cx, cy, wide)}" fill="#FBF7F3"/>` +
    `<g clip-path="url(#w${id})">` +
    `<circle cx="${ix}" cy="${iy}" r="${ir}" fill="url(#iris)"/>` +
    `<circle cx="${ix}" cy="${iy}" r="${ir * 0.48}" fill="#0E0806"/>` +
    `<circle cx="${ix - 7}" cy="${iy - 8}" r="${ir * 0.3}" fill="#fff"/>` +
    `<circle cx="${ix + 7}" cy="${iy + 6}" r="${ir * 0.13}" fill="#fff" opacity=".9"/>` +
    lid +
    `<path d="M ${cx - 50} ${cy - 44} L ${cx + 50} ${cy - 44} L ${cx + 50} ${cy - 10} L ${cx - 50} ${cy - 10} Z" fill="#000" opacity=".06"/>` +
    `</g>` +
    lash +
    flick(cx, cy, s) +
    `<path d="M ${cx - 36} ${cy + 10} C ${cx - 18} ${cy + 22} ${cx + 18} ${cy + 22} ${cx + 36} ${cy + 10}" stroke="${LOOK.hair}" stroke-width="2.5" fill="none" opacity=".45"/>`
  )
}

// ---------- brows ----------
const BROWS = {
  neutral: [404, 386, 400],
  raised: [386, 366, 382],
  up: [374, 346, 368],
  angry: [390, 388, 416],
  sad: [412, 396, 386],
  flat: [406, 400, 404],
  low: [410, 396, 406],
}
function brow(s, kind) {
  const [o, c, i] = BROWS[kind] || BROWS.neutral
  const outer = s < 0 ? EL - 54 : ER + 54, inner = s < 0 ? EL + 44 : ER - 44
  const mx = (outer + inner) / 2
  return `<path d="M ${outer} ${o} Q ${mx} ${c - 4} ${inner} ${i - 5} Q ${inner + (inner - outer) * 0.04} ${i + 4} ${inner} ${i + 5} Q ${mx} ${c + 12} ${outer} ${o} Z" fill="${LOOK.hair}" stroke="${LOOK.hair}" stroke-width="3" stroke-linejoin="round"/>`
}

// ---------- mouths ----------
const lipLine = (d, w = 6) => `<path d="${d}" stroke="${LOOK.lipsDark}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
function open(d, { teeth = 0, tongue = null, id }) {
  return (
    `<clipPath id="m${id}"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${LOOK.mouth}"/>` +
    `<g clip-path="url(#m${id})">` +
    (teeth ? `<rect x="400" y="${teeth[0]}" width="224" height="${teeth[1] - teeth[0]}" fill="#FFFDF8"/>` : '') +
    (tongue ? `<ellipse cx="${tongue[0]}" cy="${tongue[1]}" rx="${tongue[2]}" ry="${tongue[3]}" fill="${LOOK.tongue}"/>` : '') +
    `</g>` +
    `<path d="${d}" stroke="${LOOK.lips}" stroke-width="6" fill="none" stroke-linejoin="round"/>`
  )
}
const smile = (w = 46, c = 1) =>
  `<path d="M ${CX - w} 656 Q ${CX} ${670 + 8 * c} ${CX + w} 656 Q ${CX} ${692 + 6 * c} ${CX - w} 656 Z" fill="url(#lip)"/>` +
  lipLine(`M ${CX - w - 4} 654 Q ${CX} ${672 + 8 * c} ${CX + w + 4} 654`, 5)

const MOUTHS = {
  smile: () => smile(),
  shy: () => smile(32, 0.6),
  smirk: () => `<path d="M 474 664 Q 522 684 560 648 Q 520 698 474 664 Z" fill="url(#lip)"/>` + lipLine('M 472 664 Q 522 682 562 646', 5),
  grin: id => open('M 446 648 Q 512 664 578 648 Q 566 716 512 720 Q 458 716 446 648 Z', { teeth: [640, 670], tongue: [512, 714, 36, 18], id }),
  laugh: id => open('M 440 640 Q 512 654 584 640 Q 576 752 512 756 Q 448 752 440 640 Z', { teeth: [630, 662], tongue: [512, 744, 44, 24], id }),
  stars: id => open('M 462 654 Q 512 666 562 654 Q 552 708 512 712 Q 472 708 462 654 Z', { teeth: [648, 670], tongue: [512, 708, 30, 14], id }),
  O: id => open('M 490 676 C 490 640 534 640 534 676 C 534 712 490 712 490 676 Z', { tongue: [512, 704, 16, 8], id }),
  ah: id => open('M 486 672 C 486 646 538 646 538 672 C 538 696 486 696 486 672 Z', { tongue: [512, 694, 18, 8], id }),
  sneeze: id => open('M 456 646 Q 512 640 568 646 Q 570 716 512 724 Q 454 716 456 646 Z', { tongue: [512, 718, 36, 16], id }),
  yawn1: id => open('M 492 676 C 492 652 532 652 532 676 C 532 698 492 698 492 676 Z', { tongue: [512, 696, 14, 6], id }),
  yawn2: id => open('M 484 678 C 484 638 540 638 540 678 C 540 716 484 716 484 678 Z', { tongue: [512, 714, 22, 10], id }),
  yawn: id => open('M 472 690 C 472 622 552 622 552 690 C 552 754 472 754 472 690 Z', { tongue: [512, 752, 32, 14], id }),
  yawn4: id => open('M 490 674 C 490 652 534 652 534 674 C 534 694 490 694 490 674 Z', { tongue: [512, 692, 16, 6], id }),
  tongue: id =>
    open('M 470 656 Q 512 668 554 656 Q 546 684 512 686 Q 478 684 470 656 Z', { id }) +
    `<path d="M 490 674 Q 488 726 512 728 Q 536 726 534 674 Z" fill="${LOOK.tongue}" stroke="${LOOK.lips}" stroke-width="3"/>` +
    `<path d="M 512 684 L 512 712" stroke="#C25C69" stroke-width="3" stroke-linecap="round"/>`,
  grimace: id =>
    open('M 458 650 L 566 650 Q 570 692 512 694 Q 454 692 458 650 Z', { teeth: [640, 700], id }) +
    `<path d="M 462 672 L 562 672 M 486 652 L 486 690 M 512 652 L 512 692 M 538 652 L 538 690" stroke="#B9AFA6" stroke-width="2.5"/>`,
  scared: id =>
    open('M 452 662 Q 470 648 488 662 Q 506 676 524 662 Q 542 648 560 662 Q 574 694 512 698 Q 450 694 452 662 Z', { teeth: [640, 700], id }) +
    `<path d="M 458 676 L 566 676" stroke="#B9AFA6" stroke-width="2.5"/>`,
  wobble: id => open('M 462 664 Q 478 652 494 664 Q 512 676 530 664 Q 546 652 562 664 Q 552 704 512 706 Q 472 704 462 664 Z', { tongue: [512, 702, 30, 12], id }),
  kiss: () =>
    `<ellipse cx="512" cy="668" rx="22" ry="18" fill="url(#lip)" stroke="${LOOK.lipsDark}" stroke-width="3"/>` + lipLine('M 496 668 Q 512 664 528 668', 3),
  whistle: () =>
    `<ellipse cx="512" cy="670" rx="17" ry="15" fill="url(#lip)" stroke="${LOOK.lipsDark}" stroke-width="3"/><ellipse cx="512" cy="670" rx="6" ry="5" fill="${LOOK.mouth}"/>`,
  fish: () =>
    `<ellipse cx="512" cy="660" rx="30" ry="13" fill="url(#lip)" stroke="${LOOK.lipsDark}" stroke-width="3"/>` +
    `<ellipse cx="512" cy="682" rx="30" ry="13" fill="url(#lip)" stroke="${LOOK.lipsDark}" stroke-width="3"/>`,
  pout: () => `<path d="M 482 676 Q 512 656 542 676 Q 512 690 482 676 Z" fill="url(#lip)"/>` + lipLine('M 478 678 Q 512 656 546 678', 6),
  flat: () => lipLine('M 476 670 L 548 670', 6),
  raised: () => lipLine('M 480 670 Q 512 676 546 664', 6),
  sick: () => lipLine('M 466 670 Q 478 660 490 670 Q 502 680 514 670 Q 526 660 538 670 Q 550 680 560 670', 6),
  scrunch: () => lipLine('M 482 672 Q 497 662 512 672 Q 527 682 542 672', 7),
  puff: () => `<ellipse cx="512" cy="670" rx="14" ry="9" fill="url(#lip)" stroke="${LOOK.lipsDark}" stroke-width="3"/>`,
  pursed: () => `<ellipse cx="512" cy="672" rx="15" ry="11" fill="url(#lip)" stroke="${LOOK.lipsDark}" stroke-width="3"/>`,
  snore: id => open('M 498 678 C 498 660 526 660 526 678 C 526 696 498 696 498 678 Z', { id }),
}

// ---------- extras ----------
const heart = (x, y, k, fill = '#FF4F8B') =>
  `<path d="M ${x} ${y + 20 * k} C ${x - 34 * k} ${y} ${x - 22 * k} ${y - 26 * k} ${x} ${y - 9 * k} C ${x + 22 * k} ${y - 26 * k} ${x + 34 * k} ${y} ${x} ${y + 20 * k} Z" fill="${fill}"/>`
const star = (x, y, r, fill = '#FFC93C') => {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.42 : r, a = -Math.PI / 2 + (i * Math.PI) / 5
    d += `${i ? 'L' : 'M'} ${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)} `
  }
  return `<path d="${d}Z" fill="${fill}" stroke="#E39A12" stroke-width="2"/>`
}
const drop = (x, y, k = 1, fill = '#8FD3FF') =>
  `<path d="M ${x} ${y - 22 * k} C ${x + 14 * k} ${y - 2 * k} ${x + 14 * k} ${y + 12 * k} ${x} ${y + 12 * k} C ${x - 14 * k} ${y + 12 * k} ${x - 14 * k} ${y - 2 * k} ${x} ${y - 22 * k} Z" fill="${fill}" opacity=".85"/>`
const bubble = (x, y, r) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#FF8DC7" opacity=".93" stroke="#EE66AA" stroke-width="3"/>` +
  `<ellipse cx="${x - r * 0.38}" cy="${y - r * 0.42}" rx="${r * 0.22}" ry="${r * 0.12}" fill="#fff" opacity=".75" transform="rotate(-35 ${x - r * 0.38} ${y - r * 0.42})"/>`

const EXTRAS = {
  tears: () =>
    [EL, ER]
      .map(x => `<path d="M ${x - 6} ${EY + 20} Q ${x - 16} ${EY + 90} ${x - 4} ${EY + 170} L ${x + 10} ${EY + 170} Q ${x + 2} ${EY + 90} ${x + 8} ${EY + 20} Z" fill="#8FD3FF" opacity=".7"/>` + drop(x + 2, EY + 186, 0.8))
      .join(''),
  tear: () => drop(ER + 40, EY + 30, 0.6),
  sweat: () => drop(690, 360, 1.1),
  kissHeart: () => heart(604, 630, 1.1) + heart(640, 586, 0.7, '#FF7AA8'),
  note: () =>
    `<g fill="${LOOK.hair}" stroke="${LOOK.hair}"><ellipse cx="600" cy="660" rx="14" ry="10" transform="rotate(-20 600 660)"/><path d="M 612 656 L 612 600 Q 630 610 640 628" stroke-width="5" fill="none" stroke-linecap="round"/></g>`,
  drool: () => drop(540, 712, 0.7),
  snot: () => `<circle cx="540" cy="606" r="24" fill="#CFEFFF" opacity=".55" stroke="#9FD3F0" stroke-width="2"/><ellipse cx="532" cy="598" rx="6" ry="4" fill="#fff" opacity=".9"/>`,
  spray: () => [[452, 640], [580, 636], [430, 680], [600, 690], [470, 750], [560, 754], [512, 770]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#9FD8FF" opacity=".8"/>`).join(''),
  dizzy: () => star(400, 170, 22) + star(512, 130, 18) + star(626, 168, 22),
  gum1: () => bubble(512, 684, 26),
  gum2: () => bubble(512, 700, 72),
  gum3: () => bubble(512, 712, 132),
  gumpop: () =>
    `<g fill="#FF8DC7" opacity=".95"><ellipse cx="512" cy="640" rx="130" ry="58"/><circle cx="420" cy="600" r="42"/><circle cx="606" cy="606" r="46"/><circle cx="512" cy="700" r="52"/>` +
    `<path d="M 430 640 Q 424 700 432 730 L 444 730 Q 440 690 446 650 Z"/><path d="M 590 650 Q 600 710 594 742 L 606 742 Q 612 700 604 650 Z"/></g>` +
    `<ellipse cx="460" cy="610" rx="18" ry="9" fill="#fff" opacity=".6"/>`,
  flare: () => `<path d="M 480 598 Q 488 612 504 602 M 520 602 Q 536 612 544 598" stroke="${LOOK.skinShade}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  wrinkle: () => `<path d="M 496 520 Q 512 512 528 520 M 492 534 Q 512 526 532 534 M 496 548 Q 512 541 528 548" stroke="${LOOK.skinShade}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`,
  sucked: () => `<path d="M 380 590 Q 396 630 384 668 M 644 590 Q 628 630 640 668" stroke="${LOOK.skinShade}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>`,
  wind: () =>
    `<g stroke="url(#hairShine)" stroke-width="9" fill="none" stroke-linecap="round"><path d="M 760 260 C 860 250 930 280 990 250"/><path d="M 800 420 C 900 410 960 450 1010 430"/><path d="M 780 600 C 880 600 940 640 1000 620"/></g>`,
}

// ---------- the expression table ----------
// e: eye spec, or [left-of-picture eye, right-of-picture eye]; b: brows, or [left, right]
const open_ = (gx = 0, gy = 0) => ({ kind: 'open', gx, gy })
const GAZE = {
  right: [1, 0], ene: [0.92, -0.38], upright: [0.7, -0.7], nne: [0.38, -0.92], up: [0, -1], nnw: [-0.38, -0.92],
  wnw: [-0.8, -0.6], left: [-1, 0], wsw: [-0.92, 0.38], downleft: [-0.7, 0.7], ssw: [-0.38, 0.92], down: [0, 1],
  sse: [0.38, 0.92], downright: [0.7, 0.7], ese: [0.92, 0.38],
}
const FACES = {
  rest: { e: open_(), m: 'smile' },
  half: { e: { kind: 'half' }, m: 'smile' },
  closed: { e: { kind: 'closed' }, m: 'smile' },
  ...Object.fromEntries(Object.entries(GAZE).map(([n, [gx, gy]]) => [n, { e: open_(gx, gy), m: 'smile' }])),
  winkl: { e: [{ kind: 'happy' }, open_()], b: ['low', 'raised'], m: 'smirk', blush: 0.45 },
  winkr: { e: [open_(), { kind: 'happy' }], b: ['raised', 'low'], m: 'smirk', blush: 0.45 },
  kiss: { e: { kind: 'heavy' }, m: 'kiss', blush: 0.6, x: ['kissHeart'] },
  cross: { e: [open_(1, 0.15), open_(-1, 0.15)], b: 'raised', m: 'sick' },
  shock: { e: { kind: 'wide' }, b: 'up', m: 'O' },
  hearts: { e: { kind: 'hearts' }, b: 'raised', m: 'grin', blush: 0.65 },
  grin: { e: { kind: 'happy' }, b: 'raised', m: 'grin', blush: 0.45 },

  angry: { e: open_(), b: 'angry', m: 'pout', blush: 0.55, blushColour: '#E04848' },
  ouch: { e: { kind: 'squeeze' }, b: 'sad', m: 'grimace' },
  tongue: { e: [{ kind: 'happy' }, open_()], b: 'raised', m: 'tongue', blush: 0.35 },
  puff: { e: open_(), m: 'puff', puff: true, blush: 0.45 },
  laugh: { e: { kind: 'happy' }, b: 'raised', m: 'laugh', blush: 0.55 },
  scared: { e: { kind: 'wide', gx: 0, gy: 0 }, b: 'sad', m: 'scared', x: ['sweat'] },
  scrunch: { e: { kind: 'squeeze' }, b: 'angry', m: 'scrunch', x: ['wrinkle'] },
  dizzy: { e: { kind: 'spiral' }, b: 'sad', m: 'wobble', x: ['dizzy'] },
  deadpan: { e: { kind: 'heavy' }, b: 'flat', m: 'flat' },
  cry: { e: { kind: 'closed' }, b: 'sad', m: 'wobble', blush: 0.4, x: ['tears'] },
  wind: { e: { kind: 'heavy' }, b: 'low', m: 'ah', wind: true, x: ['wind'] },
  sick: { e: { kind: 'heavy' }, b: 'sad', m: 'sick', sick: true, puff: true },
  shy: { e: open_(0, 1), b: 'sad', m: 'shy', blush: 0.8 },
  sneeze1: { e: { kind: 'half' }, b: 'raised', m: 'ah', x: ['flare'] },
  sneeze2: { e: { kind: 'squeeze' }, b: 'angry', m: 'sneeze', x: ['flare', 'spray'] },

  yawn1: { e: { kind: 'heavy' }, m: 'yawn1' },
  yawn2: { e: { kind: 'half' }, b: 'raised', m: 'yawn2' },
  yawn: { e: { kind: 'closed' }, b: 'up', m: 'yawn' },
  yawn4: { e: { kind: 'heavy' }, m: 'yawn4', x: ['tear'] },
  whistle1: { e: open_(0, -1), b: 'raised', m: 'whistle', x: ['note'] },
  whistle2: { e: open_(1, 0), b: 'raised', m: 'whistle', x: ['note'] },
  gum1: { e: open_(), m: 'pursed', x: ['gum1'] },
  gum2: { e: open_(0, 0.4), b: 'raised', m: 'pursed', x: ['gum2'] },
  gum3: { e: [open_(1, 0.5), open_(-1, 0.5)], b: 'up', m: 'pursed', x: ['gum3'] },
  gumpop: { e: { kind: 'wide' }, b: 'up', m: 'O', x: ['gumpop'] },
  smug: { e: { kind: 'heavy' }, b: ['low', 'up'], m: 'smirk', blush: 0.3 },
  raised: { e: open_(), b: ['low', 'up'], m: 'raised' },
  fish: { e: { kind: 'wide' }, b: 'raised', m: 'fish', x: ['sucked'] },
  stars: { e: { kind: 'stars' }, b: 'up', m: 'stars', blush: 0.5 },
  snore: { e: { kind: 'closed' }, m: 'snore', x: ['drool', 'snot'] },
  pink: { e: open_(), m: 'smile', hair: 'pink' },
  blue: { e: open_(), m: 'smile', hair: 'blue' },
  blonde: { e: open_(), m: 'smile', hair: 'blonde' },
}

// ---------- one picture ----------
function draw(name, f) {
  const [hair, shine] = f.hair ? HAIR_COLOURS[f.hair] : [LOOK.hair, LOOK.hairShine]
  const [eL, eR] = Array.isArray(f.e) ? f.e : [f.e, f.e]
  const [bL, bR] = Array.isArray(f.b) ? f.b : [f.b || 'neutral', f.b || 'neutral']
  const blush = f.blush ?? 0.25
  const wind = f.wind ? 'transform="translate(512 120) skewX(8) translate(-512 -120)"' : ''

  const lens = (x, id) =>
    `<clipPath id="l${id}"><rect x="${x - 80}" y="${EY - 50}" width="160" height="104" rx="22"/></clipPath>` +
    `<rect x="${x - 80}" y="${EY - 50}" width="160" height="104" rx="22" fill="#DCEBFF" opacity=".10"/>` +
    `<g clip-path="url(#l${id})"><path d="M ${x - 62} ${EY + 54} L ${x - 10} ${EY - 50} L ${x + 16} ${EY - 50} L ${x - 36} ${EY + 54} Z" fill="#fff" opacity=".13"/></g>` +
    `<rect x="${x - 80}" y="${EY - 50}" width="160" height="104" rx="22" fill="none" stroke="${LOOK.glasses}" stroke-width="9"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs>
  <radialGradient id="skin" cx="512" cy="470" r="340" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${LOOK.skinLight}"/><stop offset=".62" stop-color="${LOOK.skin}"/><stop offset="1" stop-color="${LOOK.skinShade}"/>
  </radialGradient>
  <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hair}"/><stop offset="1" stop-color="${hair}"/></linearGradient>
  <clipPath id="hairClip"><path d="${BACK_HAIR}"/></clipPath>
  <linearGradient id="hairShine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shine}"/><stop offset=".7" stop-color="${shine}" stop-opacity=".6"/><stop offset="1" stop-color="${hair}"/></linearGradient>
  <radialGradient id="iris" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="${LOOK.irisLight}"/><stop offset=".55" stop-color="${LOOK.iris}"/><stop offset="1" stop-color="#140A06"/></radialGradient>
  <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.lips}"/><stop offset="1" stop-color="${LOOK.lipsDark}"/></linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="softer" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>
<g ${wind}><path d="${BACK_HAIR}" fill="url(#hair)" stroke="${shine}" stroke-width="4" stroke-opacity=".7"/><g clip-path="url(#hairClip)"><path d="M 250 210 Q 512 70 774 210" stroke="${shine}" stroke-width="46" fill="none" opacity=".55" filter="url(#soft)"/></g></g>
<path d="${FACE}" fill="url(#skin)"/>
${f.puff ? `<circle cx="352" cy="628" r="74" fill="url(#skin)"/><circle cx="672" cy="628" r="74" fill="url(#skin)"/>` : ''}
<ellipse cx="512" cy="268" rx="170" ry="30" fill="${LOOK.hair}" opacity=".2" filter="url(#soft)"/>
<ellipse cx="${EL - 22}" cy="590" rx="50" ry="27" fill="${f.blushColour || LOOK.blush}" opacity="${blush}" filter="url(#soft)"/>
<ellipse cx="${ER + 22}" cy="590" rx="50" ry="27" fill="${f.blushColour || LOOK.blush}" opacity="${blush}" filter="url(#soft)"/>
${f.sick ? `<path d="${FACE}" fill="#6DBE5A" opacity=".3"/>` : ''}
<ellipse cx="512" cy="548" rx="11" ry="34" fill="${LOOK.skinLight}" opacity=".55" filter="url(#soft)"/>
<ellipse cx="512" cy="594" rx="28" ry="12" fill="${LOOK.skinShade}" opacity=".35" filter="url(#soft)"/>
<path d="M 488 594 Q 496 604 506 598 M 518 598 Q 528 604 536 594" stroke="${LOOK.skinShade}" stroke-width="5" fill="none" stroke-linecap="round"/>
${MOUTHS[f.m](name)}
${eye(EL, -1, eL, name + 'L')}${eye(ER, 1, eR, name + 'R')}
${brow(-1, bL)}${brow(1, bR)}
<circle cx="512" cy="414" r="7.5" fill="${LOOK.bindi}"/>
${(f.x || []).filter(k => k === 'tears' || k === 'tear' || k === 'flare' || k === 'wrinkle' || k === 'sucked').map(k => EXTRAS[k]()).join('')}
<g ${f.wind ? 'transform="translate(512 300) skewX(4) translate(-512 -300)"' : ''}><path d="${curtain(-1)}" fill="url(#hair)"/><path d="${curtain(1)}" fill="url(#hair)"/>${strands(-1)}${strands(1)}</g>
${lens(EL, name + 'a')}${lens(ER, name + 'b')}
<path d="M ${EL + 80} ${EY - 14} Q 512 ${EY - 32} ${ER - 80} ${EY - 14}" stroke="${LOOK.glasses}" stroke-width="8" fill="none"/>
<path d="M ${EL - 80} ${EY - 30} L ${EL - 112} ${EY - 38} M ${ER + 80} ${EY - 30} L ${ER + 112} ${EY - 38}" stroke="${LOOK.glasses}" stroke-width="8" stroke-linecap="round"/>
${(f.x || []).filter(k => !['tears', 'tear', 'flare', 'wrinkle', 'sucked'].includes(k)).map(k => EXTRAS[k]()).join('')}
</svg>`
}

// ---------- write ----------
await fs.mkdir(OUT, { recursive: true })
const names = Object.keys(FACES)
for (const name of names) await sharp(Buffer.from(draw(name, FACES[name]))).png().toFile(path.join(OUT, `${name}.png`))
console.log(`Drew ${names.length} faces of Sami into faces-source/`)
