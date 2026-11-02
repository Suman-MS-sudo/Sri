import HeroSection from './sections/HeroSection'
import AppSection from './sections/AppSection'
import { DuoProvider } from './duo/DuoContext'

export default function App() {
  return (
    <DuoProvider>
      <main style={{ background: '#0C0C0C', overflowX: 'clip' }}>
        <HeroSection />
        <AppSection />
      </main>
    </DuoProvider>
  )
}
