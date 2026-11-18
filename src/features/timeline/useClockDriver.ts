import { useEffect } from 'react'
import { clock } from './clock'

/** Single rAF loop advancing the authoritative clock. Decoupled from fetching and rendering. */
export function useClockDriver() {
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastLiveTick = 0
    const loop = (t: number) => {
      const delta = Math.min(t - last, 250) // avoid huge jumps after tab sleep
      last = t
      const s = clock.getState()
      // Live mode only needs ~1 Hz updates.
      if (s.mode !== 'live' || t - lastLiveTick > 1000) {
        if (s.mode === 'live') lastLiveTick = t
        s.tick(delta, Date.now())
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
}
