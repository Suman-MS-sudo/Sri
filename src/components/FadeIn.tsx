import { motion } from 'framer-motion'
import type { CSSProperties, ElementType, ReactNode } from 'react'

const EASE = [0.25, 0.1, 0.25, 1] as const

// motion.create() returns a new component each call, so cache one per element type
// to keep component identity stable across renders.
const cache = new Map<ElementType, ElementType>()
function motionFor(as: ElementType): ElementType {
  let c = cache.get(as)
  if (!c) {
    c = motion.create(as as never) as ElementType
    cache.set(as, c)
  }
  return c
}

type FadeInProps = {
  children?: ReactNode
  as?: ElementType
  delay?: number
  duration?: number
  x?: number
  y?: number
  className?: string
  style?: CSSProperties
}

export default function FadeIn({ children, as = 'div', delay = 0, duration = 0.7, x = 0, y = 30, className, style }: FadeInProps) {
  const Comp = motionFor(as)
  return (
    <Comp
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ delay, duration, ease: EASE }}
    >
      {children}
    </Comp>
  )
}
