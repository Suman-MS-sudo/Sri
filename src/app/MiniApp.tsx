import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS, FOOD, GALLERY, INTRO, JOURNEYS } from '../content/love'
import StoriesViewer from './StoriesViewer'
import { PrimaryContext } from './LoveContext'
import GalleryScreen from './screens/GalleryScreen'
import PlayScreen from './screens/PlayScreen'
import StoryScreen, { type StorySheet } from './screens/StoryScreen'
import LetterScreen from './screens/LetterScreen'
import TaleScreen from './screens/TaleScreen'
import { AppNav, Menu, Sheet, TabBar, type Tab } from './ui'

type Open = null | { kind: 'story'; id: StorySheet } | { kind: 'photo' } | { kind: 'stories' }

/** Other parts of the page can switch the app's tab: window.dispatchEvent(new CustomEvent('app:go', { detail: 'letter' })) */
export const goToApp = (tab: Tab) => {
  document.getElementById('app')?.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(new CustomEvent<Tab>('app:go', { detail: tab }))
}

export default function MiniApp({ initialTab, follow = false, primary = false }: { initialTab: Tab; follow?: boolean; primary?: boolean }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [open, setOpen] = useState<Open>(null)
  const [menu, setMenu] = useState(false)
  const [photo, setPhoto] = useState(0)

  const go = (t: Tab) => { setTab(t); setOpen(null); setMenu(false) }
  const closeOpen = useCallback(() => setOpen(null), [])

  useEffect(() => {
    if (!follow) return
    const onGo = (e: Event) => go((e as CustomEvent<Tab>).detail)
    window.addEventListener('app:go', onGo)
    return () => window.removeEventListener('app:go', onGo)
  }, [follow])

  return (
    <PrimaryContext.Provider value={primary}>
    <div className="app-screen relative h-full w-full overflow-hidden bg-app-bg font-albert text-white [color-scheme:dark]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {tab === 'us' && <TaleScreen onGo={go} />}
          {tab === 'gallery' && <GalleryScreen index={photo} onSelect={setPhoto} onOpen={() => setOpen({ kind: 'photo' })} onStories={() => setOpen({ kind: 'stories' })} />}
          {tab === 'play' && <PlayScreen />}
          {tab === 'story' && <StoryScreen onOpen={id => setOpen({ kind: 'story', id })} onGo={go} />}
          {tab === 'letter' && <LetterScreen />}
        </motion.div>
      </AnimatePresence>

      <AppNav onMenu={() => setMenu(true)} onHeart={() => go('play')} />
      <TabBar tab={tab} onChange={go} />

      <Sheet open={open?.kind === 'story' && open.id === 'chapters'} title="Our Story" onClose={() => setOpen(null)}>
        <p className="mb-6 text-[15px] leading-relaxed text-white/75">{INTRO}</p>
        <div className="flex flex-col gap-4">
          {CHAPTERS.map((c, i) => (
            <article key={c.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img src={c.photo} alt={c.title} loading="lazy" className="h-40 w-full object-cover" />
              <div className="p-4">
                <span className="text-[44px] font-semibold leading-[0.8] tracking-[-0.08em] text-app-gold">{String(i + 1).padStart(2, '0')}</span>
                <h4 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">{c.title}</h4>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">{c.body}</p>
                <p className="mt-3 text-[14px] italic text-app-gold/90">“{c.quote}”</p>
              </div>
            </article>
          ))}
        </div>
      </Sheet>

      <Sheet open={open?.kind === 'story' && open.id === 'journeys'} title="Journeys" onClose={() => setOpen(null)}>
        <div className="flex flex-col gap-4">
          {JOURNEYS.map((j, i) => (
            <article key={j.city} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img src={j.photo} alt={j.city} loading="lazy" className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-end gap-3">
                  <span className="text-[44px] font-semibold leading-[0.8] tracking-[-0.08em] text-app-gold">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="text-[12px] text-white/55">
                      {j.emoji} {j.sub}
                    </p>
                    <h4 className="text-[22px] font-semibold leading-none tracking-[-0.04em]">{j.city}</h4>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-white/70">{j.body}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {j.highlights.map(h => (
                    <li key={h} className="border-t border-white/10 pt-1.5 text-[13px] text-white/70">
                      {h}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[14px] italic text-app-gold/90">“{j.quote}”</p>
              </div>
            </article>
          ))}
        </div>
      </Sheet>

      <Sheet open={open?.kind === 'story' && open.id === 'food'} title="Food Dates" onClose={() => setOpen(null)}>
        <div className="flex flex-col gap-3">
          {FOOD.map(f => (
            <article key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="text-3xl" aria-hidden="true">
                {f.icon}
              </span>
              <h4 className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">{f.title}</h4>
              <p className="mt-1 text-[14px] leading-relaxed text-white/70">{f.body}</p>
              <p className="mt-2 text-[14px] italic text-app-gold/90">“{f.quote}”</p>
            </article>
          ))}
          <p className="mt-2 text-center text-[12px] uppercase tracking-[0.2em] text-white/45">We never just ate food. We collected memories.</p>
        </div>
      </Sheet>

      <StoriesViewer open={open?.kind === 'stories'} start={photo} onClose={closeOpen} />

      <PhotoViewer open={open?.kind === 'photo'} index={photo} onIndex={setPhoto} onClose={() => setOpen(null)} />

      <Menu open={menu} onClose={() => setMenu(false)} onGo={go} onTop={() => { setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
    </PrimaryContext.Provider>
  )
}

/** Full-screen photos: swipe or use the arrows. */
function PhotoViewer({ open, index, onIndex, onClose }: { open: boolean; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const startX = useRef<number | null>(null)
  const step = (d: number) => onIndex((index + d + GALLERY.length) % GALLERY.length)
  const p = GALLERY[index]
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[66] flex flex-col bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={e => (startX.current = e.clientX)}
          onPointerUp={e => {
            if (startX.current === null) return
            const dx = e.clientX - startX.current
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
            startX.current = null
          }}
          role="dialog"
          aria-label="Photo viewer"
        >
          <div className="flex items-center justify-between px-5 pt-[34px]">
            <span className="text-[13px] text-white/60">
              {index + 1} / {GALLERY.length}
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="glass-btn flex h-12 w-12 items-center justify-center">
              <X size={20} />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={p.src}
                src={p.src}
                alt={p.title.join(' ')}
                draggable={false}
                className="max-h-full max-w-full select-none object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="glass-btn absolute left-3 flex h-11 w-11 items-center justify-center rounded-full">
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="glass-btn absolute right-3 flex h-11 w-11 items-center justify-center rounded-full">
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="px-5 pb-8 pt-4">
            <p className="text-[40px] font-semibold leading-[0.85] tracking-[-0.05em]">{p.title.join(' ')}</p>
            <p className="mt-2 text-[14px] text-white/60">{p.caption}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
