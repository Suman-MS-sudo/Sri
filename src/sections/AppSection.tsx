import { useEffect, useRef, useState } from 'react'
import { InViewContext } from '../app/LoveContext'
import MiniApp, { goToApp } from '../app/MiniApp'
import PhoneMockup from '../app/PhoneMockup'

// Everything after the landing page lives in one app: three live phones side by side on larger
// screens, and the same app full-screen on a phone.
export default function AppSection() {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  // mount only the layout that fits, so there is a single live game on the page
  const [desktop, setDesktop] = useState(() => matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = matchMedia('(min-width: 768px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // she opened an invite link: take her straight to the game
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('room')) return
    const t = setTimeout(() => goToApp('play'), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <InViewContext.Provider value={inView}>
      <section id="app" ref={ref} className={`app-anim relative w-full overflow-hidden font-albert ${inView ? 'is-in' : ''}`}>
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0"
          style={{ background: 'radial-gradient(50% 40% at 20% 30%, rgba(237, 180, 11, .06) 0%, transparent 70%), radial-gradient(45% 40% at 85% 75%, rgba(225, 6, 0, .07) 0%, transparent 70%), #070a14' }}
        />

        {desktop ? (
        <div className="relative z-[2] flex h-screen min-h-[640px] w-full items-center justify-center py-6">
          <div className="flex items-end justify-center gap-[2vw]">
            <div className="a-up ad-300">
              <PhoneMockup>
                <MiniApp initialTab="us" />
              </PhoneMockup>
            </div>
            <div className="a-up ad-500 -mb-6">
              <PhoneMockup>
                <MiniApp initialTab="play" follow primary />
              </PhoneMockup>
            </div>
            <div className="a-up ad-700">
              <PhoneMockup>
                <MiniApp initialTab="gallery" />
              </PhoneMockup>
            </div>
          </div>
        </div>

        ) : (
        <div className="relative z-[2] h-[100svh]">
          <MiniApp initialTab="us" follow primary />
        </div>
        )}
      </section>
    </InViewContext.Provider>
  )
}
