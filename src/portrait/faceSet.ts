// Her face set is picked up automatically: whatever `npm run faces` wrote into ./faces is bundled,
// with hashed file names so browsers cache it forever. Until her resting face exists, the page
// keeps using the original portrait, because two different faces must never be mixed.
const LARGE = import.meta.glob('./faces/1024/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const SMALL = import.meta.glob('./faces/640/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
// her irises in the resting face, measured by `npm run faces`; lets her eyes follow the cursor
const EYES = import.meta.glob('./faces/eyes.json', { eager: true, import: 'default' }) as Record<string, { iris?: Irises }>

type Irises = { l: [number, number, number]; r: [number, number, number] }

const byName = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]))

export type FaceSet = { sources: Record<string, string>; rest: string; count: number; eyes: Irises | null }

/** Her pictures at the size this screen needs (the same 760px cut the engine uses), or null. */
export function customFaceSet(): FaceSet | null {
  const large = byName(LARGE)
  const small = byName(SMALL)
  const sources = typeof window !== 'undefined' && window.innerWidth < 760 && small.rest ? small : large
  if (!sources.rest) return null
  return { sources, rest: sources.rest, count: Object.keys(sources).length, eyes: Object.values(EYES)[0]?.iris ?? null }
}

/** Every processed picture at full size, for the face checker. */
export const allLargeFaces = () => byName(LARGE)
