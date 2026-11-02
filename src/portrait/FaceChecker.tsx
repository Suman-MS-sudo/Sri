import { useState } from 'react'
import list from './faceList.json'
import { allLargeFaces } from './faceSet'

// Development-only page (/?faces): every face in the set, what is missing, and an overlay that
// shows how well each picture lines up with her resting face.
const faces = allLargeFaces()
const TIER_LABEL: Record<number, string> = { 1: 'Essential', 2: 'Reactions', 3: 'Smoother gaze', 4: 'Idle acts & hair' }
const CHECKER = 'repeating-conic-gradient(#1b1b1b 0% 25%, #252525 0% 50%) 50% / 24px 24px'

export default function FaceChecker() {
  const [overlay, setOverlay] = useState(false)
  const [guides, setGuides] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (name: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(name)
    setTimeout(() => setCopied(c => (c === name ? null : c)), 1500)
  }

  const have = list.faces.filter(f => faces[f.name]).length

  return (
    <div className="min-h-screen bg-[#0C0C0C] px-5 py-10 text-[#D7E2EA] md:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="hero-heading text-5xl font-black uppercase md:text-7xl">Face Checker</h1>
          <p className="mt-2 font-light text-[#D7E2EA]/70">
            {have}/{list.faces.length} faces ready.{' '}
            {faces.rest ? 'The page is using her face set.' : 'Add faces-source/rest.png and run npm run faces to start.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm uppercase tracking-widest">
          <button type="button" onClick={() => setOverlay(o => !o)} className={`rounded-full border-2 px-5 py-2 ${overlay ? 'border-[#B600A8] bg-[#B600A8]/20' : 'border-[#D7E2EA]/40'}`}>
            Overlay on rest {overlay ? 'on' : 'off'}
          </button>
          <button type="button" onClick={() => setGuides(g => !g)} className={`rounded-full border-2 px-5 py-2 ${guides ? 'border-[#B600A8] bg-[#B600A8]/20' : 'border-[#D7E2EA]/40'}`}>
            Guides {guides ? 'on' : 'off'}
          </button>
          <a href="/" className="rounded-full border-2 border-[#D7E2EA]/40 px-5 py-2">
            Open the page
          </a>
        </div>
      </header>

      {overlay && (
        <p className="mb-6 max-w-3xl text-sm font-light text-[#D7E2EA]/70">
          Overlay shows the difference from rest: parts that line up go dark, so a well-aligned face shows only its eyes or mouth glowing. A
          bright outline around the whole head means it has shifted.
        </p>
      )}

      {[1, 2, 3, 4].map(tier => (
        <section key={tier} className="mb-12">
          <h2 className="mb-4 text-xl font-medium uppercase">
            Tier {tier}: {TIER_LABEL[tier]}{' '}
            <span className="text-[#D7E2EA]/50">
              ({list.faces.filter(f => f.tier === tier && faces[f.name]).length}/{list.faces.filter(f => f.tier === tier).length})
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {list.faces
              .filter(f => f.tier === tier)
              .map(f => {
                const src = faces[f.name]
                const prompt = f.name === 'rest' ? list.base : `${list.edit} ${f.change}`
                return (
                  <figure key={f.name} className="flex flex-col gap-2">
                    <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10" style={{ background: CHECKER }}>
                      {src ? (
                        <>
                          <img src={src} alt={f.name} className="absolute inset-0 h-full w-full" />
                          {overlay && f.name !== 'rest' && faces.rest && (
                            <img src={faces.rest} alt="" className="absolute inset-0 h-full w-full" style={{ mixBlendMode: 'difference' }} />
                          )}
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                          <span className="text-sm text-[#D7E2EA]/50">missing</span>
                          <button
                            type="button"
                            onClick={() => copy(f.name, prompt)}
                            className="rounded-full border border-[#D7E2EA]/40 px-3 py-1 text-xs uppercase tracking-widest hover:bg-white/10"
                          >
                            {copied === f.name ? 'Copied ✓' : 'Copy prompt'}
                          </button>
                        </div>
                      )}
                      {guides && (
                        <div className="pointer-events-none absolute inset-0">
                          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-cyan-400/50" />
                          <div className="absolute inset-x-0 top-[46%] border-t border-dashed border-cyan-400/60" title="eyes" />
                          <div className="absolute inset-x-0 top-[65%] border-t border-dashed border-pink-400/60" title="mouth" />
                          <div className="absolute inset-x-0 top-[76%] border-t border-dashed border-amber-400/50" title="chin" />
                        </div>
                      )}
                    </div>
                    <figcaption className="flex items-center justify-between text-sm">
                      <span className="font-medium">{f.name}</span>
                      {src && (
                        <button type="button" onClick={() => copy(f.name, prompt)} className="text-xs uppercase tracking-widest text-[#D7E2EA]/50 hover:text-[#D7E2EA]">
                          {copied === f.name ? 'Copied ✓' : 'Prompt'}
                        </button>
                      )}
                    </figcaption>
                  </figure>
                )
              })}
          </div>
        </section>
      ))}

      <footer className="text-sm font-light text-[#D7E2EA]/50">
        Guides: cyan = eyes (46%) and centre, pink = mouth (65%), amber = chin (76%).
      </footer>
    </div>
  )
}
