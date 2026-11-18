import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { clamp, DAY } from '#/shared/utils/time'

export type PlaybackMode = 'live' | 'history' | 'story'

export interface PlaybackState {
  mode: PlaybackMode
  /** Unix ms — the authoritative visualization time */
  currentTime: number
  /** simulated ms per wall ms */
  speed: number
  isPlaying: boolean
  rangeStart: number
  rangeEnd: number
}

export interface ClockActions {
  /** Advance by elapsed wall time. Deterministic: same inputs → same state. */
  tick(wallDeltaMs: number, wallNow: number): void
  play(): void
  pause(): void
  toggle(): void
  seek(time: number): void
  setSpeed(speed: number): void
  setRange(durationMs: number, now: number): void
  goLive(now: number): void
}

export const SPEEDS = [600, 1800, 3600, 7200] as const

export function createClock(now: number, durationMs = DAY) {
  return createStore<PlaybackState & ClockActions>()((set, get) => ({
    mode: 'live',
    currentTime: now,
    speed: 3600,
    isPlaying: false,
    rangeStart: now - durationMs,
    rangeEnd: now,

    tick(wallDeltaMs, wallNow) {
      const s = get()
      if (s.mode === 'live') {
        // Live: clock follows wall time; range slides forward.
        const duration = s.rangeEnd - s.rangeStart
        set({ currentTime: wallNow, rangeEnd: wallNow, rangeStart: wallNow - duration })
        return
      }
      if (!s.isPlaying) return
      const next = s.currentTime + wallDeltaMs * s.speed
      if (next >= s.rangeEnd) set({ currentTime: s.rangeEnd, isPlaying: false })
      else set({ currentTime: next })
    },
    play() {
      const s = get()
      const atEnd = s.currentTime >= s.rangeEnd
      set({ mode: 'history', isPlaying: true, currentTime: atEnd || s.mode === 'live' ? s.rangeStart : s.currentTime })
    },
    pause() {
      set({ isPlaying: false })
    },
    toggle() {
      const s = get()
      if (s.isPlaying) s.pause()
      else s.play()
    },
    seek(time) {
      const s = get()
      set({ mode: 'history', currentTime: clamp(time, s.rangeStart, s.rangeEnd) })
    },
    setSpeed(speed) {
      set({ speed })
    },
    setRange(durationMs, now) {
      const s = get()
      const rangeEnd = s.mode === 'live' ? now : s.rangeEnd
      const rangeStart = rangeEnd - durationMs
      set({ rangeStart, rangeEnd, currentTime: clamp(s.currentTime, rangeStart, rangeEnd) })
    },
    goLive(now) {
      const s = get()
      const duration = s.rangeEnd - s.rangeStart
      set({ mode: 'live', isPlaying: false, currentTime: now, rangeEnd: now, rangeStart: now - duration })
    },
  }))
}

export type ClockStore = ReturnType<typeof createClock>

/** App-wide clock instance. */
export const clock = createClock(Date.now())

export function useClock<T>(selector: (s: PlaybackState & ClockActions) => T): T {
  return useStore(clock, selector)
}
