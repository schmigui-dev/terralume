import { describe, expect, it } from 'vitest'
import { createClock } from '#/features/timeline/clock'
import { DAY, HOUR } from '#/shared/utils/time'

const T0 = Date.parse('2026-11-18T00:00:00Z')

describe('clock', () => {
  it('starts live at now with a 24h range', () => {
    const c = createClock(T0).getState()
    expect(c.mode).toBe('live')
    expect(c.currentTime).toBe(T0)
    expect(c.rangeEnd - c.rangeStart).toBe(DAY)
  })

  it('follows wall time in live mode', () => {
    const c = createClock(T0)
    c.getState().tick(16, T0 + 5000)
    expect(c.getState().currentTime).toBe(T0 + 5000)
    expect(c.getState().rangeEnd).toBe(T0 + 5000)
  })

  it('play from live rewinds to range start and advances deterministically', () => {
    const c = createClock(T0)
    c.getState().setSpeed(3600)
    c.getState().play()
    expect(c.getState().mode).toBe('history')
    expect(c.getState().currentTime).toBe(T0 - DAY)
    c.getState().tick(1000, 0)
    expect(c.getState().currentTime).toBe(T0 - DAY + HOUR)
  })

  it('stops at range end', () => {
    const c = createClock(T0)
    c.getState().seek(T0 - 1000)
    c.getState().play()
    c.getState().tick(10_000, 0)
    expect(c.getState().currentTime).toBe(T0)
    expect(c.getState().isPlaying).toBe(false)
  })

  it('does not advance while paused', () => {
    const c = createClock(T0)
    c.getState().seek(T0 - HOUR)
    c.getState().tick(1000, 0)
    expect(c.getState().currentTime).toBe(T0 - HOUR)
  })

  it('clamps seeks to the range', () => {
    const c = createClock(T0)
    c.getState().seek(T0 - 10 * DAY)
    expect(c.getState().currentTime).toBe(T0 - DAY)
  })

  it('goLive returns to wall time and keeps range length', () => {
    const c = createClock(T0)
    c.getState().setRange(7 * DAY, T0)
    c.getState().seek(T0 - 3 * DAY)
    c.getState().goLive(T0 + HOUR)
    const s = c.getState()
    expect(s.mode).toBe('live')
    expect(s.currentTime).toBe(T0 + HOUR)
    expect(s.rangeEnd - s.rangeStart).toBe(7 * DAY)
  })
})
