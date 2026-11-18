import { describe, expect, it } from 'vitest'
import { subsolarPoint } from '#/shared/utils/solar'

describe('subsolarPoint', () => {
  it('sits near the equator at the March equinox, near Greenwich around 12:07 UTC', () => {
    const p = subsolarPoint(Date.parse('2026-03-20T12:07:00Z'))
    expect(Math.abs(p.lat)).toBeLessThan(0.5)
    expect(Math.abs(p.lon)).toBeLessThan(1.5)
  })

  it('reaches the Tropic of Cancer at the June solstice', () => {
    expect(subsolarPoint(Date.parse('2026-06-21T12:00:00Z')).lat).toBeCloseTo(23.44, 0)
  })

  it('reaches the Tropic of Capricorn at the December solstice', () => {
    expect(subsolarPoint(Date.parse('2026-12-21T12:00:00Z')).lat).toBeCloseTo(-23.44, 0)
  })

  it('moves west 15° per hour', () => {
    const a = subsolarPoint(Date.parse('2026-11-18T00:00:00Z')).lon
    const b = subsolarPoint(Date.parse('2026-11-18T01:00:00Z')).lon
    expect(((a - b + 540) % 360) - 180).toBeCloseTo(15, 0)
  })

  it('accounts for the equation of time (~+15 min in early November)', () => {
    // Solar noon at Greenwich ≈ 11:44 UTC on Nov 3
    const p = subsolarPoint(Date.parse('2026-11-03T11:44:00Z'))
    expect(Math.abs(p.lon)).toBeLessThan(0.5)
  })
})
