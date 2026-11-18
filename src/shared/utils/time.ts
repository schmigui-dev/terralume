export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export function floorTo(ms: number, step: number): number {
  return Math.floor(ms / step) * step
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

export function formatUtc(ms: number, withSeconds = false): string {
  const iso = new Date(ms).toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, withSeconds ? 19 : 16)} UTC`
}

export function formatRelative(ms: number, now: number): string {
  const diff = now - ms
  const abs = Math.abs(diff)
  const suffix = diff >= 0 ? 'ago' : 'from now'
  if (abs < MINUTE) return 'just now'
  if (abs < HOUR) return `${Math.round(abs / MINUTE)} min ${suffix}`
  if (abs < DAY) return `${Math.round(abs / HOUR)} h ${suffix}`
  return `${Math.round(abs / DAY)} d ${suffix}`
}
