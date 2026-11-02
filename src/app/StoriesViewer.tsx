import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GALLERY } from '../content/love'

const SHOW_MS = 5200
const HOLD_MS = 220

/** Instagram-style stories of our photos: tap the right to go on, the left to go back, hold to pause. */
export default function StoriesViewer({ open, start, onClose }: { open: boolean; start: number; onClose: () => void }) {
  return <AnimatePresence>{open && <Stories start={start} onClose={onClose} />}</AnimatePresence>
}

function Stories({ start, onClose }: { start: number; onClose: () => void }) {
  const n = GALLERY.length
  const [i, setI] = useState(start)
  const [progress, setProgress] = useState(0)
  const paused = useRef(false)
  const down = useRef({ at: 0, x: 0, w: 1 })

  // one clock for the current story; it restarts whenever the story changes
  useEffect(() => {
    let raf = 0, last = performance.now(), t = 0
    const tick = (now: number) => {
      if (!paused.current) t += now - last
      last = now
      const p = Math.min(1, t / SHOW_MS)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else if (i < n - 1) setI(i + 1)
      else onClose()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [i, n, onClose])

  const photo = GALLERY[i]
  const step = (d: number) => {
    if (i + d < 0) return setProgress(0)
    if (i + d >= n) return onClose()
    setI(i + d)
  }

  return (
    <motion.div
      className="absolute inset-0 z-[68] select-none overflow-hidden bg-black"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-label="Our stories"
      onPointerDown={e => {
        paused.current = true
        const r = e.currentTarget.getBoundingClientRect()
        down.current = { at: performance.now(), x: e.clientX - r.left, w: r.width }
      }}
      onPointerUp={() => {
        paused.current = false
        if (performance.now() - down.current.at < HOLD_MS) step(down.current.x < down.current.w * 0.3 ? -1 : 1)
      }}
      onPointerLeave={() => (paused.current = false)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={photo.src}
          src={photo.src}
          alt={photo.title.join(' ')}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: 'center 68%', transformOrigin: 'center 72%' }}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.12 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.5 }, scale: { duration: SHOW_MS / 1000 + 0.6, ease: 'linear' } }}
        />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-black/70 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-10 px-3 pt-[66px]">
        <div className="flex gap-1">
          {GALLERY.map((p, k) => (
            <div key={p.src} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between px-2">
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-white">
            sami<span className="text-app-gold">.</span> <span className="font-normal text-white/60">· memory {i + 1}</span>
          </span>
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onClick={onClose}
            aria-label="Close stories"
            className="glass-btn flex h-10 w-10 items-center justify-center rounded-full"
          >
            <X size={18} />
          </button>
        </div>
        <motion.div key={photo.src} className="mt-5 px-2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <h3 className="text-[44px] font-semibold leading-[0.85] tracking-[-0.05em] text-white drop-shadow-lg">{photo.title.join(' ')}</h3>
          <p className="mt-2 font-hand text-[24px] leading-tight text-white/90 drop-shadow">{photo.caption}</p>
        </motion.div>
      </div>
    </motion.div>
  )
}
