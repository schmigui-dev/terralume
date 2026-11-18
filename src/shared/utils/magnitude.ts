/** Documented magnitude encoding (see Legend). Radius is perceptual, not physical. */
export const MAGNITUDE_STOPS = [
  { min: 7, label: '7+', color: '#ff3b30' },
  { min: 6, label: '6–7', color: '#ff7a1a' },
  { min: 5, label: '5–6', color: '#ffb020' },
  { min: 4, label: '4–5', color: '#ffd84d' },
  { min: 2.5, label: '2.5–4', color: '#9fe7ff' },
  { min: -Infinity, label: '<2.5', color: '#6fb7d6' },
] as const

export function magnitudeColor(m: number): string {
  return (MAGNITUDE_STOPS.find((s) => m >= s.min) ?? MAGNITUDE_STOPS[MAGNITUDE_STOPS.length - 1]).color
}

/** Marker radius in globe units (earth radius = 1). Grows ~linearly with magnitude, clamped. */
export function magnitudeRadius(m: number): number {
  const clamped = Math.min(Math.max(m, 0), 9.5)
  return 0.0035 + clamped * clamped * 0.00042
}
