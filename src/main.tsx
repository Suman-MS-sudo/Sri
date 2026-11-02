import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// /?faces opens the face checker while developing; it is left out of production builds.
const Root =
  import.meta.env.DEV && new URLSearchParams(location.search).has('faces') ? lazy(() => import('./portrait/FaceChecker')) : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
