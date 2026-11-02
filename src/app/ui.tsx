import { AnimatePresence, motion } from 'framer-motion'
import { BookHeart, Gamepad2, Heart, HeartHandshake, Images, Mail, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDuo } from '../duo/DuoContext'
import { HER } from '../content/love'

export type Tab = 'us' | 'gallery' | 'play' | 'story' | 'letter'
export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'us', label: 'Us', icon: HeartHandshake },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'play', label: 'Games', icon: Gamepad2 },
  { id: 'story', label: 'Story', icon: BookHeart },
  { id: 'letter', label: 'Letter', icon: Mail },
]
export const TAB_BAR_H = 78

/** The dark background behind every screen: deep navy with a faint glow from the top. */
export function ScreenBackground({ glow = 'rgba(237, 180, 11, .07)' }: { glow?: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ background: `radial-gradient(120% 55% at 50% -5%, ${glow} 0%, transparent 60%), linear-gradient(180deg, #10142a 0%, #0a0e1c 45%, #070a14 100%)` }}
    />
  )
}

/** The small grey label with an icon that sits above every headline. */
export function Label({ icon: Icon, children, className = '' }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[15px] text-white/60 ${className}`}>
      <span>{children}</span>
      <Icon size={18} className="text-app-gold" aria-hidden="true" />
    </div>
  )
}

export function AppNav({ onMenu, onHeart }: { onMenu: () => void; onHeart: () => void }) {
  const { partner, online } = useDuo()
  const together = !!partner && online.includes(partner)
  return (
    <>
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[29] h-[104px] bg-gradient-to-b from-app-bg via-app-bg/85 to-transparent" />
    <div className="absolute left-0 right-0 top-0 z-30 mt-[20px] flex h-14 items-center justify-between px-5">
      <span className="text-[26px] font-semibold tracking-[-0.06em] text-white">
        sami<span className="text-app-gold">.</span>
      </span>
      <div className="flex">
        <button type="button" onClick={onHeart} aria-label={together ? 'Play together: your love is online' : 'Play together'} className="relative flex h-14 w-14 items-center justify-center bg-[#1b2034] ring-1 ring-inset ring-white/10">
          <Heart size={20} className="fill-app-red text-app-red" />
          {together && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />}
        </button>
        <button type="button" onClick={onMenu} aria-label="Open menu" className="glass-btn flex h-14 w-14 flex-col items-center justify-center gap-[5px]">
          <span className="h-[2px] w-[21px] rounded-full bg-white" />
          <span className="ml-[11px] h-[2px] w-[10px] rounded-full bg-white" />
        </button>
      </div>
    </div>
    </>
  )
}

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="glass absolute inset-x-0 bottom-0 z-40 flex items-start justify-around border-x-0 border-b-0 pt-2.5" style={{ height: TAB_BAR_H }}>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={tab === id ? 'page' : undefined}
          className={`flex w-[62px] flex-col items-center gap-1 text-[11px] font-medium transition-colors ${tab === id ? 'text-app-gold' : 'text-white/55'}`}
        >
          <Icon size={22} strokeWidth={tab === id ? 2.4 : 1.8} />
          {label}
        </button>
      ))}
    </nav>
  )
}

export function Menu({ open, onClose, onGo, onTop }: { open: boolean; onClose: () => void; onGo: (t: Tab) => void; onTop: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[65] flex flex-col px-6 pb-8 pt-[96px]"
          style={{ background: 'radial-gradient(90% 60% at 100% 100%, rgba(225, 6, 0, .35) 0%, transparent 70%), linear-gradient(160deg, #0a0e1c 0%, #120d18 55%, #1e0a0e 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button type="button" onClick={onClose} aria-label="Close menu" className="glass-btn absolute right-5 top-[20px] flex h-14 w-14 items-center justify-center">
            <X size={22} />
          </button>
          <div className="flex flex-col gap-5">
            {TABS.map(({ id, label }, i) => (
              <motion.button
                key={id}
                type="button"
                onClick={() => onGo(id)}
                className="text-left text-3xl font-bold tracking-tight text-white/90 transition-colors hover:text-app-gold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {label}
              </motion.button>
            ))}
          </div>
          <motion.div
            className="mt-auto mb-5 flex items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={HER.face} alt={HER.alt} className="h-20 w-20 rounded-full ring-2 ring-app-gold shadow-[0_0_24px_rgba(237,180,11,.35)]" />
            <div>
              <p className="font-hand text-[30px] leading-none text-app-gold">my Sami</p>
              <p className="mt-1 text-[13px] text-white/60">everything here is for you</p>
            </div>
          </motion.div>
          <button type="button" onClick={onTop} className="h-14 w-full bg-app-gold text-[15px] font-semibold text-black">
            Back to her
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A panel that slides up over the screen, with a title and a close button. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-[60] flex flex-col justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            className="glass no-scrollbar relative max-h-[88%] overflow-y-auto rounded-t-[28px] border-b-0 px-5 pb-10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            role="dialog"
            aria-label={title}
          >
            <div className="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between bg-[rgba(20,20,30,.92)] px-5 pb-3 pt-4">
              <div className="mx-auto h-1 w-10 rounded-full bg-white/25 absolute left-1/2 top-2 -translate-x-1/2" />
              <h3 className="text-[22px] font-semibold tracking-[-0.04em] text-white">{title}</h3>
              <button type="button" onClick={onClose} aria-label="Close" className="glass-btn flex h-10 w-10 items-center justify-center">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
