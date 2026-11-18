import { describe, expect, it } from 'vitest'
import { MAGNITUDE_STOPS, magnitudeColor, magnitudeRadius } from '#/shared/utils/magnitude'

describe('magnitude encoding', () => {
  it('is monotonic in size', () => {
    for (let m = 0; m < 9; m += 0.5) expect(magnitudeRadius(m + 0.5)).toBeGreaterThan(magnitudeRadius(m))
  })
  it('clamps extremes', () => {
    expect(magnitudeRadius(-3)).toBe(magnitudeRadius(0))
    expect(magnitudeRadius(12)).toBe(magnitudeRadius(9.5))
  })
  it('uses documented color stops', () => {
    expect(magnitudeColor(7.2)).toBe(MAGNITUDE_STOPS[0].color)
    expect(magnitudeColor(4.5)).toBe(MAGNITUDE_STOPS[3].color)
    expect(magnitudeColor(1)).toBe(MAGNITUDE_STOPS[5].color)
  })
})
