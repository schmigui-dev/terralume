import { useEffect, useState } from 'react'
import { clock } from './clock'

/** Clock time sampled at a low rate, for React UI that doesn't need 60 Hz. */
export function useCoarseTime(intervalMs = 250): number {
  const [t, setT] = useState(() => clock.getState().currentTime)
  useEffect(() => {
    const id = setInterval(() => setT(clock.getState().currentTime), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return t
}
