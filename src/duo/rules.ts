// Turn-based games: pure rules. The room's creator applies every move, so both phones always agree.
// Players are 0 and 1 (their place in the room); a board is plain JSON so it can travel and be saved.
import { GALLERY } from '../content/love'

export type P = 0 | 1
export type XO = { cells: (P | null)[]; turn: P; line: number[] | null }
export type C4 = { cols: P[][]; turn: P; line: [number, number][] | null } // each column, bottom to top
export type Mem = { cards: number[]; owner: (P | null)[]; open: number[]; turn: P; pairs: [number, number] }
export type Rps = { picks: (number | null)[]; score: [number, number]; last: { picks: [number, number]; w: P | null } | null }
export type Board = XO | C4 | Mem | Rps
export type Ended = { winner: P | null; scores: [number, number] }
type Outcome = { board: Board; end?: Ended } | null // null: not allowed

export const TURN_GAMES = ['xo', 'c4', 'memory', 'rps'] as const
export type TurnGame = (typeof TURN_GAMES)[number]
export const isTurnGame = (g: string): g is TurnGame => (TURN_GAMES as readonly string[]).includes(g)

export const C4_COLS = 7, C4_ROWS = 6
export const MEM_PAIRS = 6
export const RPS_WIN = 3
const other = (p: P): P => (p === 0 ? 1 : 0)

/** A fresh board. Whoever starts alternates from game to game. */
export function initBoard(game: TurnGame, run: number): Board {
  const first = (run % 2) as P
  switch (game) {
    case 'xo':
      return { cells: Array(9).fill(null), turn: first, line: null }
    case 'c4':
      return { cols: Array.from({ length: C4_COLS }, () => []), turn: first, line: null }
    case 'memory': {
      const photos = Array.from({ length: Math.min(MEM_PAIRS, GALLERY.length) }, (_, i) => i)
      const cards = [...photos, ...photos]
      for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]] }
      return { cards, owner: cards.map(() => null), open: [], turn: first, pairs: [0, 0] }
    }
    case 'rps':
      return { picks: [null, null], score: [0, 0], last: null }
  }
}

const XO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

export function applyMove(game: TurnGame, b: Board, p: P, move: Record<string, unknown>): Outcome {
  switch (game) {
    case 'xo': {
      const s = b as XO, i = Number(move.cell)
      if (s.line || s.turn !== p || !(i >= 0 && i < 9) || s.cells[i] !== null) return null
      const cells = s.cells.slice(); cells[i] = p
      const line = XO_LINES.find(l => l.every(k => cells[k] === p)) ?? null
      const board: XO = { cells, turn: other(p), line }
      if (line) return { board, end: { winner: p, scores: p === 0 ? [1, 0] : [0, 1] } }
      if (cells.every(c => c !== null)) return { board, end: { winner: null, scores: [0, 0] } }
      return { board }
    }
    case 'c4': {
      const s = b as C4, c = Number(move.col)
      if (s.line || s.turn !== p || !(c >= 0 && c < C4_COLS) || s.cols[c].length >= C4_ROWS) return null
      const cols = s.cols.map(col => col.slice()); cols[c].push(p)
      const r = cols[c].length - 1
      const at = (x: number, y: number) => cols[x]?.[y]
      let line: [number, number][] | null = null
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const run: [number, number][] = [[c, r]]
        for (const dir of [1, -1]) for (let k = 1; k < 4 && at(c + dx * k * dir, r + dy * k * dir) === p; k++) run.push([c + dx * k * dir, r + dy * k * dir])
        if (run.length >= 4) { line = run; break }
      }
      const board: C4 = { cols, turn: other(p), line }
      if (line) return { board, end: { winner: p, scores: p === 0 ? [1, 0] : [0, 1] } }
      if (cols.every(col => col.length >= C4_ROWS)) return { board, end: { winner: null, scores: [0, 0] } }
      return { board }
    }
    case 'memory': {
      const s = b as Mem
      // after a miss, the two cards stay up for a moment; anyone's phone then asks to turn them back
      if (move.hide) return s.open.length === 2 ? { board: { ...s, open: [], turn: other(s.turn) } } : null
      const i = Number(move.card)
      if (s.turn !== p || s.open.length >= 2 || !(i >= 0 && i < s.cards.length) || s.owner[i] !== null || s.open.includes(i)) return null
      const open = [...s.open, i]
      if (open.length < 2) return { board: { ...s, open } }
      const [a, c] = open
      if (s.cards[a] !== s.cards[c]) return { board: { ...s, open } } // a miss: shown, then hidden
      const owner = s.owner.slice(); owner[a] = p; owner[c] = p
      const pairs: [number, number] = [...s.pairs]; pairs[p]++
      const board: Mem = { ...s, owner, open: [], pairs } // a match: same player goes again
      if (owner.every(o => o !== null)) return { board, end: { winner: pairs[0] === pairs[1] ? null : pairs[0] > pairs[1] ? 0 : 1, scores: pairs } }
      return { board }
    }
    case 'rps': {
      const s = b as Rps, pick = Number(move.pick)
      if (!(pick >= 0 && pick < 3) || s.picks[p] !== null) return null
      const picks = s.picks.slice(); picks[p] = pick
      if (picks[0] === null || picks[1] === null) return { board: { ...s, picks } }
      // 0 beats 2, 1 beats 0, 2 beats 1 (rock, paper, scissors)
      const [x, y] = picks as [number, number]
      const w: P | null = x === y ? null : (x - y + 3) % 3 === 1 ? 0 : 1
      const score: [number, number] = [...s.score]; if (w !== null) score[w]++
      const board: Rps = { picks: [null, null], score, last: { picks: [x, y], w } }
      if (score[0] >= RPS_WIN || score[1] >= RPS_WIN) return { board, end: { winner: score[0] > score[1] ? 0 : 1, scores: score } }
      return { board }
    }
  }
}
