import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { TAB_BAR_H } from '../app/ui'
import { useDuo, type ChatMsg } from './DuoContext'

const QUICK = ['❤️', '😘', '😂', '😍', '🥺', '🔥', '👏', '😜', '🙈', '💋']
/** A message of only emoji (no letters or digits) floats up across both screens. */
const isEmojiOnly = (t: string) => /\p{Extended_Pictographic}/u.test(t) && !/[\p{L}\p{N}]/u.test(t) && [...t].length <= 8

type Burst = { id: string; emoji: string; x: number; delay: number; drift: number }

/** A small chat for while you play: quick emojis and short messages, nothing saved. */
export default function ChatBox() {
  const { chat, say, me, state } = useDuo()
  const names = state?.players ?? {}
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [seen, setSeen] = useState(0) // how many of the partner's messages have been seen
  const [preview, setPreview] = useState<ChatMsg | null>(null)
  const [bursts, setBursts] = useState<Burst[]>([])
  const list = useRef<HTMLDivElement>(null)
  const last = useRef<string | null>(null)

  const fromThem = chat.filter(m => m.from !== me).length
  const unread = open ? 0 : Math.max(0, fromThem - seen)
  useEffect(() => { if (open) setSeen(fromThem) }, [open, fromThem])

  // react to each new message: float emojis, preview the partner's words while the chat is closed
  useEffect(() => {
    const m = chat[chat.length - 1]
    if (!m || m.id === last.current) return
    last.current = m.id
    if (isEmojiOnly(m.text)) {
      // keep the emoji exactly as sent: dropping its invisible style marker turns ❤️ into a grey text heart
      const emoji = m.text.trim()
      const add: Burst[] = Array.from({ length: 7 }, (_, i) => ({ id: `${m.id}-${i}`, emoji, x: 8 + Math.random() * 84, delay: i * 0.09, drift: (Math.random() - 0.5) * 60 }))
      setBursts(b => [...b, ...add])
      setTimeout(() => setBursts(b => b.filter(x => !add.includes(x))), 3400)
    }
    if (m.from !== me && !open) {
      setPreview(m)
      const t = setTimeout(() => setPreview(p => (p?.id === m.id ? null : p)), 3500)
      return () => clearTimeout(t)
    }
  }, [chat, me, open])

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }) }, [chat.length, open])

  const send = (t = text) => { say(t); if (t === text) setText('') }

  return (
    <>
      {/* emoji reactions float up across the whole screen */}
      <div className="pointer-events-none absolute inset-0 z-[45] overflow-hidden" aria-hidden="true">
        {bursts.map(b => (
          <span
            key={b.id}
            className="emoji-float absolute text-[34px]"
            style={{ left: `${b.x}%`, bottom: TAB_BAR_H + 20, animationDelay: `${b.delay}s`, ['--drift' as string]: `${b.drift}px` }}
          >
            {b.emoji}
          </span>
        ))}
      </div>

      {/* the button, with the unread count and a peek at new messages */}
      {!open && (
        <div className="absolute right-4 z-[46] flex items-center gap-2" style={{ bottom: TAB_BAR_H + 14 }}>
          <AnimatePresence>
            {preview && (
              <motion.button
                type="button"
                onClick={() => setOpen(true)}
                initial={{ opacity: 0, x: 16, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16 }}
                className="glass max-w-[220px] truncate rounded-2xl rounded-br-md px-3 py-2 text-left text-[13px]"
              >
                <span className="font-semibold text-[#FF8FB0]">{names[preview.from] ?? 'Love'}: </span>
                {preview.text}
              </motion.button>
            )}
          </AnimatePresence>
          <button type="button" onClick={() => setOpen(true)} aria-label={unread ? `Chat, ${unread} new` : 'Chat'} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-app-gold text-black shadow-lg shadow-black/50 active:scale-95">
            <MessageCircle size={22} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-app-red px-1 text-[11px] font-bold text-white">{unread}</span>
            )}
          </button>
        </div>
      )}

      {/* the chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass absolute inset-x-3 z-[46] flex flex-col rounded-[22px]"
            style={{ bottom: TAB_BAR_H + 10, height: 300 }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-label="Chat"
          >
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <span className="text-[14px] font-semibold">Chat</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <X size={16} />
              </button>
            </div>

            <div ref={list} className="no-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-1">
              {chat.length === 0 && <p className="m-auto text-center text-[12px] text-white/40">Say something sweet. Nothing here is saved.</p>}
              {chat.map(m => {
                const mine = m.from === me
                const big = isEmojiOnly(m.text)
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'} ${
                      big ? 'text-[30px] leading-none' : `rounded-2xl px-3 py-1.5 text-[14px] ${mine ? 'rounded-br-md bg-app-gold text-black' : 'rounded-bl-md bg-white/10 text-white'}`
                    }`}
                  >
                    {m.text}
                  </motion.div>
                )
              })}
            </div>

            <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-1.5">
              {QUICK.map(e => (
                <button key={e} type="button" onClick={() => send(e)} className="shrink-0 rounded-full px-1.5 py-0.5 text-[22px] transition active:scale-90">
                  {e}
                </button>
              ))}
            </div>

            <form
              className="flex gap-2 px-3 pb-3"
              onSubmit={e => { e.preventDefault(); send() }}
            >
              <input
                value={text}
                onChange={e => setText(e.target.value.slice(0, 200))}
                placeholder="Message…"
                enterKeyHint="send"
                className="h-10 min-w-0 flex-1 rounded-full bg-white/10 px-4 text-[14px] text-white outline-none placeholder:text-white/35 focus:bg-white/15"
              />
              <button type="submit" disabled={!text.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-full bg-app-gold text-black disabled:opacity-40">
                <Send size={17} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
