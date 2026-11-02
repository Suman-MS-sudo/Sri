import FadeIn from '../components/FadeIn'
import HeartButton from '../components/HeartButton'
import { goToApp } from '../app/MiniApp'
import type { Tab } from '../app/ui'
import LivingPortrait from '../portrait/LivingPortrait'
import { HERO_TAGLINE } from '../content/love'

const NAV: { label: string; tab: Tab }[] = [
  { label: 'Us', tab: 'us' },
  { label: 'Gallery', tab: 'gallery' },
  { label: 'Games', tab: 'play' },
  { label: 'Letter', tab: 'letter' },
]

export default function HeroSection() {
  return (
    <section className="relative flex h-screen flex-col" style={{ overflowX: 'clip' }}>
      <FadeIn as="nav" delay={0} y={-20} className="relative z-20 flex justify-between px-6 pt-6 md:px-10 md:pt-8">
        {NAV.map(({ label, tab }) => (
          <a
            key={tab}
            href="#app"
            onClick={e => {
              e.preventDefault()
              goToApp(tab)
            }}
            className="text-sm font-medium uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 md:text-lg lg:text-[1.4rem]"
          >
            {label}
          </a>
        ))}
      </FadeIn>

      <div className="overflow-hidden">
        <FadeIn
          as="h1"
          delay={0.15}
          y={40}
          className="hero-heading mt-6 w-full whitespace-nowrap text-center text-[14vw] font-black uppercase leading-none tracking-tight sm:mt-4 sm:text-[15vw] md:-mt-5 md:text-[16vw] lg:text-[17.5vw]"
        >
          Hi, Sami
        </FadeIn>
      </div>

      <div className="relative z-20 mt-auto flex items-end justify-between px-6 pb-7 sm:pb-8 md:px-10 md:pb-10">
        <FadeIn
          as="p"
          delay={0.35}
          y={20}
          className="max-w-[160px] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[220px] md:max-w-[260px]"
          style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)' }}
        >
          {HERO_TAGLINE}
        </FadeIn>
        <FadeIn delay={0.5} y={20}>
          <HeartButton label="Open My Heart" onClick={() => goToApp('letter')} />
        </FadeIn>
      </div>

      <LivingPortrait />
    </section>
  )
}
