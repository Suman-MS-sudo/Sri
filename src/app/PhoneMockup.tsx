import { useEffect, useRef, useState, type ReactNode } from 'react'

const DESIGN_W = 390

/** An iPhone-style frame. Its screen content is laid out at 390px wide and scaled to fit. */
export default function PhoneMockup({ children, className = '' }: { children: ReactNode; className?: string }) {
  const screen = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: DESIGN_W, h: 844 })

  useEffect(() => {
    const el = screen.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = box.w / DESIGN_W
  const side = (cls: string, style: React.CSSProperties) => <div className={`absolute w-[3px] rounded-full bg-neutral-700 ${cls}`} style={style} />

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="phone-frame relative rounded-[clamp(30px,4vw,54px)] bg-black p-[clamp(6px,1vw,12px)] shadow-2xl shadow-black/60">
        <div className="pointer-events-none absolute inset-0 rounded-[clamp(30px,4vw,54px)] ring-1 ring-white/15" />
        {side('-left-[3px]', { top: '19%', height: '4.5%' })}
        {side('-left-[3px]', { top: '26%', height: '7.3%' })}
        {side('-left-[3px]', { top: '35.5%', height: '7.3%' })}
        {side('-right-[3px]', { top: '30.8%', height: '11.4%' })}
        <div ref={screen} className="relative h-full w-full overflow-hidden rounded-[clamp(24px,3.2vw,44px)] bg-app-bg">
          <div className="pointer-events-none absolute left-1/2 top-[3%] z-[70] h-[4%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute left-0 top-0" style={{ width: DESIGN_W, height: box.h / scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
