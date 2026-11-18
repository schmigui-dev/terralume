import { describe, expect, it } from 'vitest'
import { isValidCoordinate, latLonToVector, vectorToLatLon } from '#/shared/utils/geo'

describe('latLonToVector', () => {
  const close = (v: number[], e: number[]) => {
    for (const [i, x] of v.entries()) expect(x).toBeCloseTo(e[i], 6)
  }

  it('maps cardinal points to the three.js sphere UV layout', () => {
    close(latLonToVector(0, 0), [1, 0, 0])
    close(latLonToVector(0, 90), [0, 0, -1])
    close(latLonToVector(0, -90), [0, 0, 1])
    close(latLonToVector(90, 0), [0, 1, 0])
    close(latLonToVector(0, 180), [-1, 0, 0])
  })

  it('scales by radius', () => {
    close(latLonToVector(0, 0, 2.5), [2.5, 0, 0])
  })

  it('round-trips', () => {
    for (const [lat, lon] of [
      [35.68, 139.69],
      [-33.9, 18.4],
      [64.1, -21.9],
    ]) {
      const r = vectorToLatLon(...latLonToVector(lat, lon, 3))
      expect(r.lat).toBeCloseTo(lat, 6)
      expect(r.lon).toBeCloseTo(lon, 6)
    }
  })
})

describe('isValidCoordinate', () => {
  it('rejects out-of-range and non-finite values', () => {
    expect(isValidCoordinate(0, 0)).toBe(true)
    expect(isValidCoordinate(91, 0)).toBe(false)
    expect(isValidCoordinate(0, -181)).toBe(false)
    expect(isValidCoordinate(Number.NaN, 0)).toBe(false)
  })
})
