import { Mail } from 'lucide-react'
import { FOREVER, HER, LETTER } from '../../content/love'
import { Label, ScreenBackground, TAB_BAR_H } from '../ui'

export default function LetterScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ScreenBackground glow="rgba(225, 6, 0, .08)" />
      <div className="no-scrollbar absolute inset-0 z-10 overflow-y-auto px-5 pt-[96px]" style={{ paddingBottom: TAB_BAR_H + 32 }}>
        {/* her on the left, standing in a soft glow and looking across at the title on the right */}
        <div className="relative h-[380px]">
          <div aria-hidden="true" className="absolute -left-16 bottom-0 h-[320px] w-[320px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(237,180,11,.32) 0%, rgba(225,6,0,.14) 45%, transparent 70%)' }} />
          <img
            src={HER.cutout}
            alt={HER.alt}
            className="a-scale ad-300 absolute -left-9 bottom-0 h-[360px] w-auto max-w-none origin-bottom object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,.55)]"
            style={{ maskImage: 'linear-gradient(to bottom, black 78%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 78%, transparent 100%)' }}
          />
          <div className="a-up ad-500 relative z-10 flex flex-col items-end pt-1 text-right">
            <Label icon={Mail}>From my heart</Label>
            <h2 className="mt-1 text-[42px] font-normal leading-[0.95] tracking-[-0.05em] text-white">
              A Letter
              <br />
              to Sri
            </h2>
          </div>
          <p className="a-up ad-700 absolute bottom-[96px] right-0 z-10 max-w-[118px] text-right font-hand text-[25px] leading-[1.05] text-app-gold">{HER.caption}</p>
        </div>

        <article className="glass a-up ad-500 relative z-10 -mt-4 flex flex-col gap-4 rounded-[24px] p-5">
          <p className="text-[22px] font-semibold tracking-[-0.04em] text-white">{LETTER.greeting}</p>
          {LETTER.paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-white/80">
              {p}
            </p>
          ))}
          <p className="text-[18px] font-semibold text-app-gold">{LETTER.signoff}</p>
        </article>

        <div className="mt-12 flex flex-col gap-2">
          {FOREVER.map(line => (
            <p key={line} className="text-[13px] uppercase tracking-[0.2em] text-white/55">
              {line}
            </p>
          ))}
          <p className="mt-2 text-[15px] italic text-white/45">Built the home I never knew I was searching for.</p>
          <p className="mt-8 text-[64px] font-semibold leading-[0.82] tracking-[-0.05em] text-white">Sri,</p>
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">You are not part of my world.</p>
          <p className="mt-2 text-[44px] font-semibold leading-[0.9] tracking-[-0.06em] text-app-gold">You are my world. ❤️</p>
        </div>
      </div>
    </div>
  )
}
