import { createContext, useContext } from 'react'

/** Whether the app section has scrolled into view, so its entrance animations start. */
export const InViewContext = createContext(false)
export const useAppInView = () => useContext(InViewContext)

/** True in the one view of the app that runs live games (the full app on a phone, the middle phone on a computer). */
export const PrimaryContext = createContext(false)
export const usePrimary = () => useContext(PrimaryContext)
