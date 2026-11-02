export type LivingPortraitOptions = {
  /** A custom face set: picture name → URL. Must include `rest`; any other name may be missing. */
  sources?: Record<string, string>
  /** Irises of the resting face ([cx, cy, r] in texture units); with sources.eyebase her irises follow the gaze. */
  eyes?: { l: [number, number, number]; r: [number, number, number] }
}

/** Starts the living portrait engine on the #magnetWrap markup and returns a dispose function. */
export function mountLivingPortrait(options?: LivingPortraitOptions): () => void

declare global {
  interface Window {
    __faceEngine?: boolean
  }
}
