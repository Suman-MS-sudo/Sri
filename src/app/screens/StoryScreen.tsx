import { motion } from 'framer-motion'
import { ArrowRight, BookHeart, ChevronRight, MapPin, UtensilsCrossed } from 'lucide-react'
import type { ReactNode } from 'react'
import { CHAPTERS, FOOD, GALLERY, INTRO, JOURNEYS } from '../../content/love'
import { Label, ScreenBackground, TAB_BAR_H, type Tab } from '../ui'

export type StorySheet = 'chapters' | 'journeys' | 'food'

const two = (n: number) => String(n).padStart(2, '0')

/** Rises into place the first time it scrolls into view. */
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function SectionTitle({ icon, label, title }: { icon: typeof MapPin; label: string; title: string }) {
  return (
    <Reveal className="mb-4">
      <Label icon={icon}>{label}</Label>
      <h3 className="mt-1 text-[34px] font-normal leading-[0.95] tracking-[-0.05em] text-white">{title}</h3>
    </Reveal>
  )
}

/** Our story, told top to bottom: how it began, the chapters, the journeys, the food, and on to the letter. */
export default function StoryScreen({ onOpen, onGo }: { onOpen: (s: StorySheet) => void; onGo: (t: Tab) => void }) {
  // the first sentence of the intro leads in large; the rest follows
  const cut = INTRO.indexOf('. ') + 1
  const lead = cut > 0 ? INTRO.slice(0, cut) : INTRO
  const rest = cut > 0 ? INTRO.slice(cut).trim() : ''
  const stats: [number, string][] = [
    [CHAPTERS.length, 'chapters'],
    [JOURNEYS.length, 'journeys'],
    [GALLERY.length, 'memories'],
  ]
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ScreenBackground />
      <div className="no-scrollbar absolute inset-0 z-10 overflow-y-auto px-5 pt-[96px]" style={{ paddingBottom: TAB_BAR_H + 36 }}>
        {/* who */}
        <div className="a-up ad-300">
          <Label icon={BookHeart}>Our story</Label>
          <h2 className="mt-1 text-[56px] font-normal leading-[0.83] tracking-[-0.08em] text-white">
            Sri
            <br />& Sami
          </h2>
        </div>
        <div className="a-up ad-500 mt-5 grid grid-cols-3 gap-2">
          {stats.map(([n, label]) => (
            <div key={label} className="glass rounded-2xl px-3 pb-2.5 pt-3">
              <p className="text-[46px] font-semibold leading-[0.8] tracking-[-0.07em] text-app-gold">{two(n)}</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/55">{label}</p>
            </div>
          ))}
        </div>

        {/* how it began */}
        <Reveal className="mt-9">
          <span aria-hidden="true" className="block font-hand text-[64px] leading-[0.5] text-app-gold">“</span>
          <p className="mt-2 text-[25px] font-semibold leading-[1.15] tracking-[-0.03em] text-white">{lead}</p>
          <p className="mt-3 text-[15px] leading-[1.7] text-white/65">{rest}</p>
        </Reveal>

        {/* the chapters, as a timeline */}
        <div className="mt-12">
          <SectionTitle icon={BookHeart} label="Four chapters" title="How we happened" />
          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-6 left-[11px] top-3 w-[2px] rounded-full bg-gradient-to-b from-app-gold via-app-gold/40 to-app-red/30" />
            {CHAPTERS.map((c, i) => (
              <li key={c.title} className="relative pb-9 pl-10 last:pb-2">
                <span aria-hidden="true" className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-app-bg ring-2 ring-app-gold">
                  <span className="h-2 w-2 rounded-full bg-app-gold shadow-[0_0_10px] shadow-app-gold" />
                </span>
                <Reveal>
                  <p className="text-[13px] font-semibold tracking-[0.12em] text-app-gold">CHAPTER {two(i + 1)}</p>
                  <h4 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.04em] text-white">{c.title}</h4>
                  <img src={c.photo} alt={c.title} loading="lazy" className="mt-3 h-44 w-full rounded-2xl object-cover ring-1 ring-white/10" />
                  <p className="mt-3 text-[14px] leading-relaxed text-white/70">{c.body}</p>
                  <p className="mt-3 font-hand text-[24px] leading-[1.15] text-app-gold/95">“{c.quote}”</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        {/* the journeys, side by side */}
        <div className="mt-10">
          <SectionTitle icon={MapPin} label="Places that hold us" title="Our journeys" />
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
            {JOURNEYS.map((j, i) => (
              <button
                key={j.city}
                type="button"
                onClick={() => onOpen('journeys')}
                className="glass flex w-[78%] shrink-0 snap-center flex-col overflow-hidden rounded-[26px] text-left"
              >
                {/* the photo stays clear: no text over our faces */}
                <span className="relative block h-[210px] w-full">
                  <img src={j.photo} alt={j.city} loading="lazy" className="h-full w-full object-cover" />
                  <span className="glass-btn absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full">
                    <ChevronRight size={18} />
                  </span>
                </span>
                <span className="flex flex-1 flex-col p-4">
                  <span className="text-[12px] text-white/60">
                    {two(i + 1)} · {j.emoji} {j.sub}
                  </span>
                  <span className="mt-1 text-[28px] font-semibold leading-[1] tracking-[-0.05em] text-white">{j.city}</span>
                  <span className="mt-2 line-clamp-2 font-hand text-[20px] leading-tight text-app-gold">“{j.quote}”</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* food dates */}
        <div className="mt-12">
          <SectionTitle icon={UtensilsCrossed} label="We never just ate" title="Food dates" />
          <div className="grid grid-cols-2 gap-2">
            {FOOD.map((f, i) => (
              <Reveal key={f.title} delay={(i % 2) * 0.08}>
                <button type="button" onClick={() => onOpen('food')} className="glass flex h-full w-full flex-col gap-2 rounded-2xl p-3.5 text-left">
                  <span className="text-[28px] leading-none" aria-hidden="true">
                    {f.icon}
                  </span>
                  <span className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-white">{f.title}</span>
                  <span className="line-clamp-3 text-[12px] leading-snug text-white/55">{f.body}</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>

        {/* and on to the letter */}
        <Reveal className="mt-14 text-center">
          <p className="font-hand text-[30px] leading-tight text-white/85">And the story continues…</p>
          <button type="button" onClick={() => onGo('letter')} className="mx-auto mt-5 flex h-14 items-center gap-2 rounded-2xl bg-app-gold px-7 text-[15px] font-semibold text-black active:scale-[0.98]">
            Read my letter <ArrowRight size={18} />
          </button>
        </Reveal>
      </div>
    </div>
  )
}
