import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, Heart, Images, Play } from 'lucide-react'
import { useState } from 'react'
import { GALLERY } from '../../content/love'
import { Label, ScreenBackground, TAB_BAR_H } from '../ui'

type Photo = (typeof GALLERY)[number]
const two = (n: number) => String(n).padStart(2, '0')
// our faces are usually in the lower part of the frame: when a photo is cropped, keep that part
const FOCUS = 'center 68%'

type Props = { index: number; onSelect: (i: number) => void; onOpen: () => void; onStories: () => void }

/** A stack of photo cards: swipe the top one away, tap it to flip it over and read the note on the back. */
export default function GalleryScreen({ index, onSelect, onOpen, onStories }: Props) {
  const [dir, setDir] = useState(1)
  const n = GALLERY.length
  const go = (d: 1 | -1) => {
    setDir(d)
    onSelect((index + d + n) % n)
  }
  const photo = GALLERY[index]
  const behind = [1, 2].map(k => GALLERY[(index + k) % n])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <ScreenBackground />

      <button
        type="button"
        onClick={onStories}
        className="a-up ad-500 absolute right-5 top-[98px] z-20 flex items-center gap-1.5 rounded-full bg-app-gold px-3.5 py-2 text-[13px] font-semibold text-black shadow-lg shadow-black/40"
      >
        <Play size={14} className="fill-black" /> Play stories
      </button>

      <div className="a-up ad-300 relative z-10 px-5 pt-[96px]">
        <Label icon={Images}>
          Memory {two(index + 1)} / {two(n)}
        </Label>
        <h2 key={index} className="a-speed mt-1 text-[46px] font-normal leading-[0.92] tracking-[-0.05em] text-white">
          {photo.title[0]}
          <br />
          {photo.title[1]}
        </h2>
      </div>

      <div className="a-scale ad-500 absolute inset-x-0 z-10 flex justify-center" style={{ top: 236, bottom: TAB_BAR_H + 92 }}>
        <div className="relative aspect-[3/4] h-full max-w-[calc(100%-40px)]">
          {behind
            .slice()
            .reverse()
            .map((p, k) => {
              const depth = 2 - k
              return (
                <div
                  key={p.src}
                  className="absolute inset-0 overflow-hidden rounded-[26px] ring-1 ring-white/15 transition-all duration-500"
                  style={{
                    transform: `translateY(${-16 * depth}px) scale(${1 - 0.07 * depth}) rotate(${depth === 1 ? 4 : -5}deg)`,
                    opacity: depth === 1 ? 0.75 : 0.45,
                  }}
                >
                  <img src={p.src} alt="" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: FOCUS }} />
                </div>
              )
            })}
          <AnimatePresence custom={dir} initial={false}>
            <TopCard key={photo.src} photo={photo} dir={dir} onThrow={go} onOpen={onOpen} />
          </AnimatePresence>
        </div>
      </div>

      <div className="a-up ad-700 absolute inset-x-0 z-10 flex items-center gap-3 px-5" style={{ bottom: TAB_BAR_H + 18 }}>
        <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="glass-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          <ChevronLeft size={22} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <p key={index} className="w-full truncate text-center text-[14px] text-white/80">
            {photo.caption}
          </p>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {GALLERY.map((p, i) => (
              <span key={p.src} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-5 bg-app-gold' : 'w-1.5 bg-white/35'}`} />
            ))}
          </div>
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Next photo" className="glass-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  )
}

function TopCard({ photo, dir, onThrow, onOpen }: { photo: Photo; dir: number; onThrow: (d: 1 | -1) => void; onOpen: () => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const [flipped, setFlipped] = useState(false)

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -90 || info.velocity.x < -500) onThrow(1)
    else if (info.offset.x > 90 || info.velocity.x > 500) onThrow(-1)
  }
  const face = 'absolute inset-0 overflow-hidden rounded-[26px] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'

  // the outer layer flies in and out; the middle one follows the finger; the inner one flips
  return (
    <motion.div
      className="absolute inset-0"
      custom={dir}
      variants={{
        enter: (d: number) => (d > 0 ? { scale: 0.93, y: -16, rotate: 4, opacity: 0.75 } : { x: -420, rotate: -14, opacity: 0 }),
        center: { scale: 1, y: 0, x: 0, rotate: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -460 : 460, rotate: d > 0 ? -16 : 16, opacity: 0, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }),
      }}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Flip the photo back' : `${photo.title.join(' ')}: flip it over to read the note`}
        className="absolute inset-0 cursor-grab touch-pan-y [perspective:1400px] active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={onDragEnd}
        onTap={() => setFlipped(f => !f)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setFlipped(f => !f))}
      >
        <motion.div
          className="absolute inset-0 shadow-2xl shadow-black/60 [transform-style:preserve-3d]"
          style={{ borderRadius: 26 }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 140 }}
        >
          <div className={`${face} ring-1 ring-white/20`}>
            <img src={photo.src} alt={photo.title.join(' ')} draggable={false} className="pointer-events-none h-full w-full select-none object-cover" style={{ objectPosition: FOCUS }} />
            <button
              type="button"
              onPointerDownCapture={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onOpen() }}
              aria-label="Open full screen"
              className="glass-btn absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full"
            >
              <Expand size={17} />
            </button>
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
              Tap to flip
            </span>
          </div>

          {/* the back of the photo: paper, with a note in your handwriting */}
          <div
            className={`${face} flex flex-col px-6 pb-6 pt-7 text-[#efe4d2] ring-1 ring-white/10 [transform:rotateY(180deg)]`}
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0 33px, rgba(255, 255, 255, .05) 33px 34px), radial-gradient(120% 80% at 0% 0%, #1d2238 0%, #11152a 60%, #0c0f1f 100%)',
              boxShadow: 'inset 0 0 60px rgba(0, 0, 0, .45)',
            }}
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-app-gold">{photo.title.join(' ')}</span>
            <p className="mt-5 font-hand text-[30px] leading-[1.13]">{photo.note}</p>
            <div className="mt-auto flex items-end justify-between">
              <span className="flex items-center gap-1.5 font-hand text-[26px] text-[#ff6b6b]">
                <Heart size={20} className="fill-[#ff6b6b] text-[#ff6b6b]" /> always yours
              </span>
              <span className="text-[11px] text-white/40">tap to flip back</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
